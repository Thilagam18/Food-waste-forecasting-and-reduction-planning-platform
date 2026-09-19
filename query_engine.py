import json
import os
import re
from typing import Any, Dict, Optional
import duckdb
import pandas as pd

try:
    import openai
except ImportError:
    openai = None


def parse_query_with_llm(query: str) -> Dict[str, Any]:
    """
    Uses OpenAI GPT-4o-mini to parse a manager's plain-language query into structured intent and filters.
    Falls back to rule-based keyword matching if OpenAI API is unavailable or unconfigured.
    """
    api_key = os.environ.get("OPENAI_API_KEY")

    if openai and api_key:
        try:
            client = openai.OpenAI(api_key=api_key)
            prompt = f"""
You are an intent parser for a Retail Sales & Inventory Copilot.
Available data fields in the system:
- Stores: store_id, store_name, location
- Products: sku_id, product_name, category, unit_cost, retail_price, lead_time_days, min_safety_stock
- Inventory: store_id, sku_id, current_stock, last_restock_date
- Sales: transaction_id, date, store_id, sku_id, quantity_sold, revenue

Supported Intent Types:
- "STOCKOUT_RISK": Questions about running out of stock, low inventory, stock-out alerts, buffer deficits.
- "DEADSTOCK": Questions about slow-moving, non-moving, excess stock, items with 0 sales or DOS > 60 days.
- "SALES_ANOMALY": Questions about sudden spikes, unusual sales volume, anomalies, volume surges.
- "DAYS_OF_SUPPLY": Questions asking for DOS, stock coverage, how long inventory will last.
- "AVERAGE_DAILY_SALES": Questions asking for ADS, daily velocity, run rate, average sales per day.
- "GENERAL_SUMMARY": Broad overview questions about inventory status, summary dashboard, overall performance.
- "DATA_UNAVAILABLE": Questions asking for data OUTSIDE the system scope (e.g. competitor prices, store footfall/traffic, customer reviews/sentiment, employee salaries, weather, supplier phone numbers, online ads).

User Query: "{query}"

Respond ONLY with a valid JSON object with the following schema:
{{
  "intent": "STOCKOUT_RISK" | "DEADSTOCK" | "SALES_ANOMALY" | "DAYS_OF_SUPPLY" | "AVERAGE_DAILY_SALES" | "GENERAL_SUMMARY" | "DATA_UNAVAILABLE",
  "store_filter": string or null (e.g. "STR-001"),
  "sku_filter": string or null (e.g. "SKU-1001"),
  "category_filter": string or null (e.g. "Electronics"),
  "reasoning": string explanation
}}
"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            if content:
                return json.loads(content)
        except Exception as e:
            # Fall back to heuristic rule-based parsing if API call fails
            pass

    # Heuristic Rule-Based Fallback Classifier
    q_lower = query.lower()

    # Out-of-scope keywords check
    out_of_scope_keywords = [
        "competitor", "footfall", "traffic", "sentiment", "review",
        "weather", "salary", "salaries", "employee", "ad spend",
        "advertisement", "supplier phone", "market share"
    ]
    if any(kw in q_lower for kw in out_of_scope_keywords):
        return {
            "intent": "DATA_UNAVAILABLE",
            "store_filter": None,
            "sku_filter": None,
            "category_filter": None,
            "reasoning": "Query requests data outside internal retail schema."
        }

    # Intent detection keywords
    if any(kw in q_lower for kw in ["run out", "running out", "stockout", "stock-out", "low stock", "depleted", "risk of running"]):
        intent = "STOCKOUT_RISK"
    elif any(kw in q_lower for kw in ["not moving", "deadstock", "dead stock", "slow moving", "excess stock", "overstocked", "tied up"]):
        intent = "DEADSTOCK"
    elif any(kw in q_lower for kw in ["anomaly", "anomalies", "spike", "spikes", "surge", "unusual", "outlier"]):
        intent = "SALES_ANOMALY"
    elif any(kw in q_lower for kw in ["days of supply", "dos", "coverage", "how long will stock last"]):
        intent = "DAYS_OF_SUPPLY"
    elif any(kw in q_lower for kw in ["average daily sales", "ads", "daily velocity", "daily rate"]):
        intent = "AVERAGE_DAILY_SALES"
    else:
        intent = "GENERAL_SUMMARY"

    # Extract store/sku/category if mentioned
    store_match = re.search(r"\bstr-\d{3}\b", q_lower)
    sku_match = re.search(r"\bsku-\d{4}\b", q_lower)

    return {
        "intent": intent,
        "store_filter": store_match.group(0).upper() if store_match else None,
        "sku_filter": sku_match.group(0).upper() if sku_match else None,
        "category_filter": None,
        "reasoning": "Parsed using heuristic fallback parser."
    }


def process_manager_query(
    query: str,
    df_inventory: pd.DataFrame,
    df_sales: pd.DataFrame,
    df_products: pd.DataFrame,
    df_stores: Optional[pd.DataFrame] = None,
) -> Dict[str, Any]:
    """
    Processes a retail manager's natural language query over sales & inventory data.
    
    Returns a dictionary containing:
      - `calculated_data`: Exact numeric table slice or 'DATA_UNAVAILABLE'
      - `assumptions_used`: Detailed domain formulas and filters applied
      - `is_grounded`: Boolean indicating if response is grounded in available data
    """
    # 1. Parse intent using LLM or rule-based fallback
    parsed = parse_query_with_llm(query)
    intent = parsed.get("intent", "GENERAL_SUMMARY")
    store_filter = parsed.get("store_filter")
    sku_filter = parsed.get("sku_filter")
    category_filter = parsed.get("category_filter")

    # 2. Strict Fallback Handling for missing/out-of-scope data
    if intent == "DATA_UNAVAILABLE":
        return {
            "calculated_data": "DATA_UNAVAILABLE",
            "assumptions_used": f"The query asks for data outside internal inventory & sales scope. Reasoning: {parsed.get('reasoning', 'Data unavailable')}.",
            "is_grounded": False,
        }

    # 3. Setup DuckDB in-memory environment for deterministic queries
    con = duckdb.connect(database=":memory:")
    con.register("inventory", df_inventory)
    con.register("sales", df_sales)
    con.register("products", df_products)

    if df_stores is not None:
        con.register("stores", df_stores)
    else:
        # Create minimal stores view if df_stores not passed
        unique_stores = pd.DataFrame({"store_id": df_inventory["store_id"].unique()})
        unique_stores["store_name"] = unique_stores["store_id"]
        unique_stores["location"] = "N/A"
        con.register("stores", unique_stores)

    # Determine reference max date
    max_date_res = con.execute("SELECT MAX(CAST(date AS DATE)) FROM sales").fetchone()
    ref_date_str = str(max_date_res[0]) if max_date_res and max_date_res[0] else "2026-09-01"

    # Base ADS & DOS CTE
    base_analytics_query = f"""
    WITH date_window AS (
        SELECT 
            CAST('{ref_date_str}' AS DATE) AS end_date,
            CAST('{ref_date_str}' AS DATE) - INTERVAL '29 DAYS' AS start_date
    ),
    sales_30d AS (
        SELECT 
            s.store_id,
            s.sku_id,
            SUM(s.quantity_sold) as total_qty_sold_30d,
            SUM(s.revenue) as total_revenue_30d
        FROM sales s, date_window dw
        WHERE CAST(s.date AS DATE) BETWEEN dw.start_date AND dw.end_date
        GROUP BY s.store_id, s.sku_id
    ),
    dos_table AS (
        SELECT 
            i.store_id,
            st.store_name,
            i.sku_id,
            p.product_name,
            p.category,
            p.unit_cost,
            p.retail_price,
            p.lead_time_days,
            p.min_safety_stock,
            i.current_stock,
            COALESCE(s30.total_qty_sold_30d, 0) as total_qty_sold_30d,
            ROUND(COALESCE(s30.total_qty_sold_30d, 0) / 30.0, 4) as ads,
            CASE 
                WHEN COALESCE(s30.total_qty_sold_30d, 0) > 0 THEN ROUND(i.current_stock / (s30.total_qty_sold_30d / 30.0), 2)
                WHEN i.current_stock > 0 THEN 999.0
                ELSE 0.0
            END AS dos
        FROM inventory i
        JOIN stores st ON i.store_id = st.store_id
        JOIN products p ON i.sku_id = p.sku_id
        LEFT JOIN sales_30d s30 ON i.store_id = s30.store_id AND i.sku_id = s30.sku_id
    )
    """

    where_clauses = []
    if store_filter:
        where_clauses.append(f"store_id = '{store_filter}'")
    if sku_filter:
        where_clauses.append(f"sku_id = '{sku_filter}'")
    if category_filter:
        where_clauses.append(f"category = '{category_filter}'")

    where_str = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Execute specific intent query
    if intent == "STOCKOUT_RISK":
        filter_sql = where_str + (" AND " if where_str else " WHERE ") + "dos < lead_time_days AND ads > 0"
        sql = base_analytics_query + f" SELECT store_id, store_name, sku_id, product_name, category, current_stock, lead_time_days, ads, dos FROM dos_table {filter_sql} ORDER BY dos ASC"
        assumptions = "ADS computed over 30-day window. Stock-out Risk condition: DOS (Days of Supply) < lead_time_days AND ADS > 0."

    elif intent == "DEADSTOCK":
        filter_sql = where_str + (" AND " if where_str else " WHERE ") + "(total_qty_sold_30d = 0 AND current_stock > 0) OR dos > 60.0"
        sql = base_analytics_query + f" SELECT store_id, store_name, sku_id, product_name, category, current_stock, unit_cost, ROUND(current_stock * unit_cost, 2) as tied_up_capital, total_qty_sold_30d, ads, dos FROM dos_table {filter_sql} ORDER BY tied_up_capital DESC"
        assumptions = "Deadstock condition: 0 sales in last 30 days with positive stock OR DOS > 60 days. Tied-up capital = current_stock * unit_cost."

    elif intent == "SALES_ANOMALY":
        anomaly_where = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        sql = f"""
        WITH date_window AS (
            SELECT 
                CAST('{ref_date_str}' AS DATE) AS end_date,
                CAST('{ref_date_str}' AS DATE) - INTERVAL '29 DAYS' AS start_date
        ),
        daily_sales AS (
            SELECT 
                CAST(s.date AS DATE) as date,
                s.store_id,
                s.sku_id,
                SUM(s.quantity_sold) as daily_qty
            FROM sales s, date_window dw
            WHERE CAST(s.date AS DATE) BETWEEN dw.start_date AND dw.end_date
            GROUP BY CAST(s.date AS DATE), s.store_id, s.sku_id
        ),
        stats AS (
            SELECT 
                store_id,
                sku_id,
                AVG(daily_qty) as mean_qty,
                STDDEV_SAMP(daily_qty) as std_qty
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
            ROUND(st.mean_qty, 2) as mean_30d_qty,
            ROUND(st.std_qty, 2) as std_30d_qty,
            ROUND((ds.daily_qty - st.mean_qty) / NULLIF(st.std_qty, 0), 2) as z_score
        FROM daily_sales ds
        JOIN stats st ON ds.store_id = st.store_id AND ds.sku_id = st.sku_id
        JOIN stores st_tbl ON ds.store_id = st_tbl.store_id
        JOIN products p ON ds.sku_id = p.sku_id
        {anomaly_where}
        {'AND' if anomaly_where else 'WHERE'} st.std_qty > 0 AND ds.daily_qty > (st.mean_qty + 2.0 * st.std_qty)
        ORDER BY z_score DESC
        """
        assumptions = "Sales Anomaly condition: Daily sales volume > (30-day mean + 2 * 30-day std_dev)."

    elif intent in ["DAYS_OF_SUPPLY", "AVERAGE_DAILY_SALES"]:
        sql = base_analytics_query + f" SELECT store_id, store_name, sku_id, product_name, category, current_stock, ads, dos FROM dos_table {where_str} ORDER BY store_id, sku_id"
        assumptions = "ADS = 30-day total quantity sold / 30. DOS = current_stock / ADS."

    else:  # GENERAL_SUMMARY
        sql = base_analytics_query + f" SELECT store_id, store_name, sku_id, product_name, category, current_stock, lead_time_days, ads, dos FROM dos_table {where_str} ORDER BY dos ASC"
        assumptions = "General inventory metrics evaluated across 30-day window."

    # Execute and convert to DataFrame / Dict
    try:
        calculated_df = con.execute(sql).df()
        if store_filter or sku_filter or category_filter:
            assumptions += f" Filters applied -> Store: {store_filter}, SKU: {sku_filter}, Category: {category_filter}."

        return {
            "calculated_data": calculated_df,
            "assumptions_used": assumptions,
            "is_grounded": True,
        }
    except Exception as err:
        return {
            "calculated_data": "DATA_UNAVAILABLE",
            "assumptions_used": f"Query execution failed: {str(err)}",
            "is_grounded": False,
        }


if __name__ == "__main__":
    print("=" * 60)
    print("RETAIL SALES & INVENTORY COPILOT - QUERY ENGINE TEST")
    print("=" * 60)

    # Load test datasets
    df_stores = pd.read_csv("data/stores.csv")
    df_products = pd.read_csv("data/products.csv")
    df_inventory = pd.read_csv("data/inventory.csv")
    df_sales = pd.read_csv("data/sales.csv")

    test_queries = [
        "Which items are at risk of running out of stock?",
        "Show me deadstock items that are not moving in Downtown Flagship",
        "Were there any sales volume spikes or anomalies recently?",
        "What are our competitor prices and store footfall numbers?",
    ]

    for q in test_queries:
        print(f"\nQUERY: '{q}'")
        res = process_manager_query(q, df_inventory, df_sales, df_products, df_stores)
        print(f"  Is Grounded: {res['is_grounded']}")
        print(f"  Assumptions: {res['assumptions_used']}")
        if res["is_grounded"]:
            data = res["calculated_data"]
            print(f"  Calculated Data Rows: {len(data)}")
            if not data.empty:
                print(data.head(3).to_string(index=False))
        else:
            print(f"  Calculated Data: {res['calculated_data']}")
