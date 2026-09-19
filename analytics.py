import os
from typing import Any, Dict, List, Optional, Tuple
import duckdb
import pandas as pd


class RetailAnalyticsEngine:
    """
    Analytics engine leveraging DuckDB and Pandas to compute core retail, sales,
    and inventory metrics including ADS, DOS, Stock-out Risks, Deadstock, and Sales Anomalies.
    """

    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.con = duckdb.connect(database=":memory:")
        self._load_tables()

    def _load_tables(self):
        """Loads CSV files from data_dir into DuckDB in-memory tables."""
        stores_path = os.path.join(self.data_dir, "stores.csv").replace("\\", "/")
        products_path = os.path.join(self.data_dir, "products.csv").replace("\\", "/")
        inventory_path = os.path.join(self.data_dir, "inventory.csv").replace("\\", "/")
        sales_path = os.path.join(self.data_dir, "sales.csv").replace("\\", "/")

        self.con.execute(f"CREATE TABLE stores AS SELECT * FROM read_csv_auto('{stores_path}')")
        self.con.execute(f"CREATE TABLE products AS SELECT * FROM read_csv_auto('{products_path}')")
        self.con.execute(f"CREATE TABLE inventory AS SELECT * FROM read_csv_auto('{inventory_path}')")
        self.con.execute(f"CREATE TABLE sales AS SELECT CAST(date AS DATE) as date, transaction_id, store_id, sku_id, quantity_sold, revenue FROM read_csv_auto('{sales_path}')")

    def get_max_date(self) -> pd.Timestamp:
        """Returns the latest transaction date present in the sales dataset."""
        result = self.con.execute("SELECT MAX(date) FROM sales").fetchone()
        if result and result[0]:
            return pd.Timestamp(result[0])
        return pd.Timestamp.now()

    def get_average_daily_sales(
        self, window_days: int = 30, ref_date: Optional[pd.Timestamp] = None
    ) -> pd.DataFrame:
        """
        Calculates Average Daily Sales (ADS) over the last N days per store and SKU.
        ADS = total_quantity_sold_in_window / window_days
        """
        if ref_date is None:
            ref_date = self.get_max_date()

        ref_date_str = ref_date.strftime("%Y-%m-%d")

        query = f"""
        WITH date_window AS (
            SELECT 
                CAST('{ref_date_str}' AS DATE) AS end_date,
                CAST('{ref_date_str}' AS DATE) - INTERVAL '{window_days - 1} DAYS' AS start_date
        ),
        sales_in_window AS (
            SELECT 
                s.store_id,
                s.sku_id,
                SUM(s.quantity_sold) as total_qty_sold,
                SUM(s.revenue) as total_revenue
            FROM sales s, date_window dw
            WHERE s.date BETWEEN dw.start_date AND dw.end_date
            GROUP BY s.store_id, s.sku_id
        )
        SELECT 
            i.store_id,
            i.sku_id,
            COALESCE(sw.total_qty_sold, 0) as total_qty_sold_30d,
            COALESCE(sw.total_revenue, 0.0) as total_revenue_30d,
            ROUND(COALESCE(sw.total_qty_sold, 0) / {float(window_days)}, 4) as ads
        FROM inventory i
        LEFT JOIN sales_in_window sw 
            ON i.store_id = sw.store_id AND i.sku_id = sw.sku_id
        """
        return self.con.execute(query).df()

    def get_days_of_supply(
        self, window_days: int = 30, ref_date: Optional[pd.Timestamp] = None
    ) -> pd.DataFrame:
        """
        Calculates Days of Supply (DOS = current_stock / ADS) for all store-SKU inventory combinations.
        If ADS is 0 and current_stock > 0, DOS is treated as infinity (999.0 for numeric safety).
        """
        ads_df = self.get_average_daily_sales(window_days=window_days, ref_date=ref_date)
        self.con.register("ads_view", ads_df)

        query = """
        SELECT 
            i.store_id,
            st.store_name,
            st.location,
            i.sku_id,
            p.product_name,
            p.category,
            p.unit_cost,
            p.retail_price,
            p.lead_time_days,
            p.min_safety_stock,
            i.current_stock,
            i.last_restock_date,
            a.total_qty_sold_30d,
            a.ads,
            CASE 
                WHEN a.ads > 0 THEN ROUND(i.current_stock / a.ads, 2)
                WHEN i.current_stock > 0 THEN 999.0
                ELSE 0.0
            END AS dos
        FROM inventory i
        JOIN stores st ON i.store_id = st.store_id
        JOIN products p ON i.sku_id = p.sku_id
        JOIN ads_view a ON i.store_id = a.store_id AND i.sku_id = a.sku_id
        ORDER BY store_id, sku_id
        """
        return self.con.execute(query).df()

    def get_stockout_risk_alerts(
        self, window_days: int = 30, ref_date: Optional[pd.Timestamp] = None
    ) -> pd.DataFrame:
        """
        Returns inventory items flagged for Stock-out Risk.
        Alert Condition: DOS < lead_time_days AND ADS > 0
        """
        dos_df = self.get_days_of_supply(window_days=window_days, ref_date=ref_date)
        self.con.register("dos_view", dos_df)

        query = """
        SELECT 
            store_id,
            store_name,
            sku_id,
            product_name,
            category,
            current_stock,
            lead_time_days,
            min_safety_stock,
            ads,
            dos,
            ROUND(lead_time_days - dos, 2) as buffer_deficit_days,
            'STOCKOUT_RISK' as alert_type
        FROM dos_view
        WHERE dos < lead_time_days AND ads > 0
        ORDER BY dos ASC
        """
        return self.con.execute(query).df()

    def get_deadstock_alerts(
        self,
        window_days: int = 30,
        dos_threshold: float = 60.0,
        ref_date: Optional[pd.Timestamp] = None,
    ) -> pd.DataFrame:
        """
        Returns inventory items flagged as Deadstock.
        Alert Condition: (0 sales in 30 days AND current_stock > 0) OR (DOS > dos_threshold)
        """
        dos_df = self.get_days_of_supply(window_days=window_days, ref_date=ref_date)
        self.con.register("dos_view", dos_df)

        query = f"""
        SELECT 
            store_id,
            store_name,
            sku_id,
            product_name,
            category,
            current_stock,
            unit_cost,
            ROUND(current_stock * unit_cost, 2) as tied_up_capital,
            total_qty_sold_30d,
            ads,
            dos,
            CASE 
                WHEN total_qty_sold_30d = 0 THEN 'ZERO_SALES_30D'
                ELSE 'HIGH_DOS_OVER_60D'
            END as deadstock_reason,
            'DEADSTOCK' as alert_type
        FROM dos_view
        WHERE (total_qty_sold_30d = 0 AND current_stock > 0) OR (dos > {float(dos_threshold)})
        ORDER BY tied_up_capital DESC
        """
        return self.con.execute(query).df()

    def get_sales_anomalies(
        self,
        window_days: int = 30,
        z_threshold: float = 2.0,
        ref_date: Optional[pd.Timestamp] = None,
    ) -> pd.DataFrame:
        """
        Detects daily sales anomalies for each store-SKU combination.
        Condition: Daily sales > (30-day mean + z_threshold * 30-day std_dev)
        """
        if ref_date is None:
            ref_date = self.get_max_date()

        ref_date_str = ref_date.strftime("%Y-%m-%d")

        query = f"""
        WITH date_window AS (
            SELECT 
                CAST('{ref_date_str}' AS DATE) AS end_date,
                CAST('{ref_date_str}' AS DATE) - INTERVAL '{window_days - 1} DAYS' AS start_date
        ),
        daily_sales AS (
            SELECT 
                s.date,
                s.store_id,
                s.sku_id,
                SUM(s.quantity_sold) as daily_qty,
                SUM(s.revenue) as daily_revenue
            FROM sales s, date_window dw
            WHERE s.date BETWEEN dw.start_date AND dw.end_date
            GROUP BY s.date, s.store_id, s.sku_id
        ),
        stats AS (
            SELECT 
                store_id,
                sku_id,
                AVG(daily_qty) as mean_daily_qty,
                STDDEV_SAMP(daily_qty) as std_daily_qty
            FROM daily_sales
            GROUP BY store_id, sku_id
        )
        SELECT 
            ds.date,
            ds.store_id,
            st_tbl.store_name,
            ds.sku_id,
            p.product_name,
            ds.daily_qty,
            ds.daily_revenue,
            ROUND(st.mean_daily_qty, 2) as mean_qty,
            ROUND(COALESCE(st.std_daily_qty, 0), 2) as std_qty,
            ROUND((ds.daily_qty - st.mean_daily_qty) / NULLIF(st.std_daily_qty, 0), 2) as z_score,
            'SALES_ANOMALY' as alert_type
        FROM daily_sales ds
        JOIN stats st ON ds.store_id = st.store_id AND ds.sku_id = st.sku_id
        JOIN stores st_tbl ON ds.store_id = st_tbl.store_id
        JOIN products p ON ds.sku_id = p.sku_id
        WHERE st.std_daily_qty > 0 
          AND ds.daily_qty > (st.mean_daily_qty + {float(z_threshold)} * st.std_daily_qty)
        ORDER BY z_score DESC, ds.date DESC
        """
        return self.con.execute(query).df()

    def get_copilot_summary(self, window_days: int = 30) -> Dict[str, pd.DataFrame]:
        """
        Returns a comprehensive dictionary containing all metrics, risk alerts, and copilot datasets.
        """
        max_date = self.get_max_date()
        dos_df = self.get_days_of_supply(window_days=window_days, ref_date=max_date)
        stockout_alerts = self.get_stockout_risk_alerts(window_days=window_days, ref_date=max_date)
        deadstock_alerts = self.get_deadstock_alerts(window_days=window_days, ref_date=max_date)
        sales_anomalies = self.get_sales_anomalies(window_days=window_days, ref_date=max_date)

        return {
            "max_date": max_date,
            "days_of_supply": dos_df,
            "stockout_alerts": stockout_alerts,
            "deadstock_alerts": deadstock_alerts,
            "sales_anomalies": sales_anomalies,
        }

    @staticmethod
    def calculate_clearance_scenario(
        current_stock: int, unit_cost: float, retail_price: float, discount_pct: float
    ) -> Dict[str, float]:
        """Calculates margin and freed capital for deadstock clearance scenarios."""
        discounted_price = round(retail_price * (1.0 - discount_pct / 100.0), 2)
        profit_per_unit = round(discounted_price - unit_cost, 2)
        total_revenue = round(current_stock * discounted_price, 2)
        total_profit = round(current_stock * profit_per_unit, 2)
        margin_pct = round((profit_per_unit / discounted_price * 100.0), 2) if discounted_price > 0 else 0.0

        return {
            "discount_pct": discount_pct,
            "original_price": retail_price,
            "discounted_price": discounted_price,
            "unit_cost": unit_cost,
            "profit_per_unit": profit_per_unit,
            "total_freed_capital": total_revenue,
            "total_projected_profit": total_profit,
            "margin_pct": margin_pct,
        }

    @staticmethod
    def calculate_reorder_scenario(
        current_stock: int,
        ads: float,
        lead_time_days: int,
        express_lead_days: int,
        express_cost_per_unit: float,
        retail_price: float,
        unit_cost: float,
    ) -> Dict[str, Any]:
        """Calculates shipping trade-off cost between standard reorder vs express reorder."""
        ads = max(0.01, ads)
        days_left = current_stock / ads

        std_stockout_days = max(0.0, lead_time_days - days_left)
        std_lost_units = round(std_stockout_days * ads, 1)
        std_lost_revenue = round(std_lost_units * retail_price, 2)

        exp_stockout_days = max(0.0, express_lead_days - days_left)
        exp_lost_units = round(exp_stockout_days * ads, 1)
        exp_lost_revenue = round(exp_lost_units * retail_price, 2)

        reorder_qty = max(20, int((lead_time_days * ads * 1.5) - current_stock))
        express_freight_cost = round(reorder_qty * express_cost_per_unit, 2)
        net_express_savings = round((std_lost_revenue - exp_lost_revenue) - express_freight_cost, 2)

        return {
            "reorder_qty": reorder_qty,
            "days_until_stockout": round(days_left, 1),
            "std_lead_days": lead_time_days,
            "std_lost_revenue": std_lost_revenue,
            "express_lead_days": express_lead_days,
            "express_lost_revenue": exp_lost_revenue,
            "express_freight_cost": express_freight_cost,
            "net_express_benefit": net_express_savings,
            "recommend_express": net_express_savings > 0,
        }

    @staticmethod
    def generate_purchase_order_payload(
        store_id: str, store_name: str, sku_id: str, product_name: str, reorder_qty: int, unit_cost: float
    ) -> Tuple[str, pd.DataFrame]:
        """Generates formatted Purchase Order text and downloadable DataFrame."""
        total_cost = round(reorder_qty * unit_cost, 2)
        po_text = f"""====================================================
PURCHASE ORDER DRAFT (RETAIL COPILOT)
====================================================
PO Number: PO-2026-{store_id}-{sku_id[-4:]}
Date Generated: 2026-09-05
Destination Store: {store_name} ({store_id})
Supplier: Global Supply Distribution Inc.

ITEM DETAILS:
- SKU ID: {sku_id}
- Item Description: {product_name}
- Quantity Ordered: {reorder_qty} units
- Unit Cost: ${unit_cost:.2f}
- Estimated Total Cost: ${total_cost:,.2f}

APPROVAL STATUS: Pending Store Manager Signature
===================================================="""
        po_df = pd.DataFrame(
            [
                {
                    "PO_Number": f"PO-2026-{store_id}-{sku_id[-4:]}",
                    "Date": "2026-09-05",
                    "Store_ID": store_id,
                    "Store_Name": store_name,
                    "SKU_ID": sku_id,
                    "Product_Name": product_name,
                    "Quantity_Ordered": reorder_qty,
                    "Unit_Cost": unit_cost,
                    "Total_Estimated_Cost": total_cost,
                }
            ]
        )
        return po_text, po_df

    @staticmethod
    def generate_clearance_memo_payload(
        store_id: str, store_name: str, sku_id: str, product_name: str, original_price: float, discount_pct: float
    ) -> str:
        """Generates a Markdown clearance memo printout for store staff."""
        discounted_price = round(original_price * (1.0 - discount_pct / 100.0), 2)
        savings = round(original_price - discounted_price, 2)
        memo_text = f"""# 🏷️ STORE CLEARANCE MARKDOWN NOTICE
**Store Location**: {store_name} ({store_id})  
**Target SKU**: {product_name} (`{sku_id}`)  
**Effective Date**: Immediate  

---

### Markdown Instructions for Retail Staff:
1. **Original Tag Price**: `${original_price:.2f}`
2. **Applied Discount**: **{discount_pct}% OFF**
3. **NEW SALE PRICE**: **`${discounted_price:.2f}`** *(Customer Saves `${savings:.2f}`)*
4. **Action Required**: Apply yellow promotional clearance stickers onto current inventory tags on display shelves.

*Generated automatically by Retail Copilot Assistant.*"""
        return memo_text


if __name__ == "__main__":
    print("=" * 60)
    print("RETAIL SALES & INVENTORY COPILOT - ANALYTICS ENGINE TEST")
    print("=" * 60)

    engine = RetailAnalyticsEngine(data_dir="data")
    summary = engine.get_copilot_summary()

    print(f"\nDataset Max Date: {summary['max_date'].strftime('%Y-%m-%d')}")
    print(f"Total Inventory Records Evaluated: {len(summary['days_of_supply'])}")

    print("\n--- STOCK-OUT RISK ALERTS ---")
    stockout = summary["stockout_alerts"]
    print(f"Found {len(stockout)} stock-out risk alerts:")
    if not stockout.empty:
        print(stockout[["store_id", "sku_id", "product_name", "current_stock", "lead_time_days", "ads", "dos"]].to_string(index=False))

    print("\n--- DEADSTOCK ALERTS ---")
    deadstock = summary["deadstock_alerts"]
    print(f"Found {len(deadstock)} deadstock alerts:")
    if not deadstock.empty:
        print(deadstock[["store_id", "sku_id", "product_name", "current_stock", "tied_up_capital", "dos", "deadstock_reason"]].to_string(index=False))

    print("\n--- SALES ANOMALIES (>2 Std Dev Spikes) ---")
    anomalies = summary["sales_anomalies"]
    print(f"Found {len(anomalies)} sales anomalies:")
    if not anomalies.empty:
        print(anomalies[["date", "store_id", "sku_id", "product_name", "daily_qty", "mean_qty", "z_score"]].to_string(index=False))

    print("\nAnalytics Engine execution verified successfully!")
