import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np


def generate_retail_data(
    output_dir: str = "data",
    seed: int = 42,
    days_of_history: int = 90,
    reference_date: datetime = datetime(2026, 9, 1),
):
    """
    Generates synthetic retail datasets with realistic edge cases for sales and inventory analytics.
    Creates 4 CSV files:
      - stores.csv
      - products.csv
      - inventory.csv
      - sales.csv
    """
    random.seed(seed)
    np.random.seed(seed)

    os.makedirs(output_dir, exist_ok=True)

    # 1. Generate Stores
    stores_data = [
        {"store_id": "STR-001", "store_name": "Downtown Flagship", "location": "New York, NY"},
        {"store_id": "STR-002", "store_name": "Metro Mall", "location": "Chicago, IL"},
        {"store_id": "STR-003", "store_name": "Suburban Center", "location": "Houston, TX"},
        {"store_id": "STR-004", "store_name": "Westside Outlet", "location": "San Francisco, CA"},
        {"store_id": "STR-005", "store_name": "Airport Express", "location": "Atlanta, GA"},
    ]
    stores_df = pd.DataFrame(stores_data)
    stores_df.to_csv(os.path.join(output_dir, "stores.csv"), index=False)

    # 2. Generate Products
    products_data = [
        {"sku_id": "SKU-1001", "product_name": "Noise-Canceling Headphones", "category": "Electronics", "unit_cost": 80.00, "retail_price": 199.99, "lead_time_days": 10, "min_safety_stock": 30},
        {"sku_id": "SKU-1002", "product_name": "Ergonomic Mechanical Keyboard", "category": "Electronics", "unit_cost": 45.00, "retail_price": 119.99, "lead_time_days": 7, "min_safety_stock": 25},
        {"sku_id": "SKU-1003", "product_name": "Smart Fitness Watch", "category": "Electronics", "unit_cost": 60.00, "retail_price": 149.99, "lead_time_days": 14, "min_safety_stock": 40},
        {"sku_id": "SKU-1004", "product_name": "Portable Bluetooth Speaker", "category": "Electronics", "unit_cost": 25.00, "retail_price": 69.99, "lead_time_days": 5, "min_safety_stock": 20},
        {"sku_id": "SKU-1005", "product_name": "USB-C Fast Charger", "category": "Electronics", "unit_cost": 8.00, "retail_price": 24.99, "lead_time_days": 4, "min_safety_stock": 50},
        {"sku_id": "SKU-2001", "product_name": "Premium Cotton T-Shirt", "category": "Apparel", "unit_cost": 6.50, "retail_price": 29.99, "lead_time_days": 12, "min_safety_stock": 100},
        {"sku_id": "SKU-2002", "product_name": "Slim Fit Denim Jeans", "category": "Apparel", "unit_cost": 18.00, "retail_price": 69.99, "lead_time_days": 15, "min_safety_stock": 60},
        {"sku_id": "SKU-2003", "product_name": "Lightweight Running Shoes", "category": "Apparel", "unit_cost": 35.00, "retail_price": 109.99, "lead_time_days": 14, "min_safety_stock": 45},
        {"sku_id": "SKU-2004", "product_name": "Waterproof Outdoor Jacket", "category": "Apparel", "unit_cost": 45.00, "retail_price": 139.99, "lead_time_days": 18, "min_safety_stock": 30},
        {"sku_id": "SKU-3001", "product_name": "Organic Arabica Coffee Beans (1lb)", "category": "Grocery", "unit_cost": 5.50, "retail_price": 15.99, "lead_time_days": 3, "min_safety_stock": 80},
        {"sku_id": "SKU-3002", "product_name": "Artisanal Dark Chocolate Bar", "category": "Grocery", "unit_cost": 1.80, "retail_price": 5.99, "lead_time_days": 4, "min_safety_stock": 100},
        {"sku_id": "SKU-3003", "product_name": "Plant-Based Protein Powder (2lb)", "category": "Grocery", "unit_cost": 16.00, "retail_price": 39.99, "lead_time_days": 7, "min_safety_stock": 40},
        {"sku_id": "SKU-4001", "product_name": "Stainless Steel Water Bottle", "category": "Home & Living", "unit_cost": 7.00, "retail_price": 24.99, "lead_time_days": 8, "min_safety_stock": 50},
        {"sku_id": "SKU-4002", "product_name": "Adjustable LED Desk Lamp", "category": "Home & Living", "unit_cost": 14.00, "retail_price": 44.99, "lead_time_days": 9, "min_safety_stock": 30},
        {"sku_id": "SKU-4003", "product_name": "Aromatherapy Essential Oil Diffuser", "category": "Home & Living", "unit_cost": 11.00, "retail_price": 34.99, "lead_time_days": 6, "min_safety_stock": 25},
        {"sku_id": "SKU-4004", "product_name": "Legacy Seasonal Decorative Vase", "category": "Home & Living", "unit_cost": 22.00, "retail_price": 79.99, "lead_time_days": 20, "min_safety_stock": 15},
        {"sku_id": "SKU-5001", "product_name": "Non-Slip Yoga Mat (6mm)", "category": "Sports & Fitness", "unit_cost": 10.00, "retail_price": 32.99, "lead_time_days": 7, "min_safety_stock": 35},
        {"sku_id": "SKU-5002", "product_name": "Adjustable Dumbbell Set", "category": "Sports & Fitness", "unit_cost": 75.00, "retail_price": 199.99, "lead_time_days": 14, "min_safety_stock": 15},
    ]
    products_df = pd.DataFrame(products_data)
    products_df.to_csv(os.path.join(output_dir, "products.csv"), index=False)

    # Price lookup map
    price_map = dict(zip(products_df["sku_id"], products_df["retail_price"]))
    lead_time_map = dict(zip(products_df["sku_id"], products_df["lead_time_days"]))

    # 3. Generate Daily Sales over N days
    start_date = reference_date - timedelta(days=days_of_history - 1)
    dates = [start_date + timedelta(days=i) for i in range(days_of_history)]

    sales_records = []
    txn_id_counter = 100000

    # Explicit edge cases definition
    # SKU-4004 across all stores -> Deadstock edge case (Zero sales in last 45 days)
    # SKU-1001 at STR-001 -> Stock-out risk edge case (High daily sales, very low current stock)
    # SKU-3001 at STR-002 -> Sales Anomaly edge case (normal 2-5 per day, but single massive spike on day 80)

    for current_d in dates:
        date_str = current_d.strftime("%Y-%m-%d")
        days_from_ref = (reference_date - current_d).days

        for store in stores_data:
            s_id = store["store_id"]

            for prod in products_data:
                p_id = prod["sku_id"]

                # Edge case 1: Deadstock - SKU-4004 has NO sales in the last 45 days
                if p_id == "SKU-4004" and days_from_ref <= 45:
                    continue

                # Determine base sales probability
                if random.random() < 0.65:  # ~65% chance of sale per day per store-sku
                    # Normal sales volume
                    base_qty = random.randint(1, 6)

                    # Edge case 2: Stock-out risk setup - SKU-1001 at STR-001 has high steady sales (~12-18/day)
                    if s_id == "STR-001" and p_id == "SKU-1001":
                        base_qty = random.randint(12, 18)

                    # Edge case 3: Sales Anomaly - SKU-3001 at STR-002 on reference_date - 5 days
                    if s_id == "STR-002" and p_id == "SKU-3001" and days_from_ref == 5:
                        base_qty = 85  # Huge spike compared to normal 2-5

                    revenue = round(base_qty * price_map[p_id], 2)
                    sales_records.append(
                        {
                            "transaction_id": f"TXN-{txn_id_counter}",
                            "date": date_str,
                            "store_id": s_id,
                            "sku_id": p_id,
                            "quantity_sold": base_qty,
                            "revenue": revenue,
                        }
                    )
                    txn_id_counter += 1

    sales_df = pd.DataFrame(sales_records)
    sales_df.to_csv(os.path.join(output_dir, "sales.csv"), index=False)

    # 4. Generate Current Inventory
    # Base inventory levels with explicit injected conditions
    inventory_records = []

    for store in stores_data:
        s_id = store["store_id"]
        for prod in products_data:
            p_id = prod["sku_id"]
            lead_time = lead_time_map[p_id]

            # Controlled stock levels for edge cases
            if s_id == "STR-001" and p_id == "SKU-1001":
                # Stock-out risk: current stock = 15 units (ADS is ~15, so DOS ~ 1 day < lead_time of 10 days)
                stock = 15
                last_restock = (reference_date - timedelta(days=25)).strftime("%Y-%m-%d")
            elif p_id == "SKU-4004":
                # Deadstock: stock = 250 units, zero sales in last 45 days (DOS will be infinity / > 60 days)
                stock = 250
                last_restock = (reference_date - timedelta(days=70)).strftime("%Y-%m-%d")
            elif s_id == "STR-003" and p_id == "SKU-2002":
                # Deadstock condition: high stock (400 units) with low ADS (~1.5 units/day), DOS ~ 266 days > 60 days
                stock = 400
                last_restock = (reference_date - timedelta(days=50)).strftime("%Y-%m-%d")
            else:
                # Normal healthy stock levels (2 to 5 times safety stock)
                safety = prod["min_safety_stock"]
                stock = random.randint(int(safety * 1.5), int(safety * 4.0))
                last_restock = (reference_date - timedelta(days=random.randint(2, 20))).strftime("%Y-%m-%d")

            inventory_records.append(
                {
                    "store_id": s_id,
                    "sku_id": p_id,
                    "current_stock": stock,
                    "last_restock_date": last_restock,
                }
            )

    inventory_df = pd.DataFrame(inventory_records)
    inventory_df.to_csv(os.path.join(output_dir, "inventory.csv"), index=False)

    print("Data generation complete!")
    print(f"  - Stores: {len(stores_df)} records -> {os.path.join(output_dir, 'stores.csv')}")
    print(f"  - Products: {len(products_df)} records -> {os.path.join(output_dir, 'products.csv')}")
    print(f"  - Inventory: {len(inventory_df)} records -> {os.path.join(output_dir, 'inventory.csv')}")
    print(f"  - Sales: {len(sales_df)} records -> {os.path.join(output_dir, 'sales.csv')}")


if __name__ == "__main__":
    generate_retail_data()
