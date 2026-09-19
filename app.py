import os
import pandas as pd
import streamlit as st

from analytics import RetailAnalyticsEngine
from copilot_llm import generate_copilot_response
from generate_data import generate_retail_data
from query_engine import process_manager_query

# ---------------------------------------------------------
# Page Configuration & Modern Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="Retail Sales & Inventory Copilot",
    page_icon="🛒",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS styling
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #64748B;
        margin-bottom: 1.5rem;
    }
    .feed-card {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 1.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        height: 100%;
    }
    .card-title-stockout {
        font-size: 1.1rem;
        font-weight: 700;
        color: #DC2626;
        margin-bottom: 0.5rem;
    }
    .card-title-deadstock {
        font-size: 1.1rem;
        font-weight: 700;
        color: #D97706;
        margin-bottom: 0.5rem;
    }
    .card-title-anomaly {
        font-size: 1.1rem;
        font-weight: 700;
        color: #2563EB;
        margin-bottom: 0.5rem;
    }
    .card-metric {
        font-size: 1.35rem;
        font-weight: 700;
        color: #0F172A;
    }
    .card-subtext {
        font-size: 0.88rem;
        color: #475569;
        margin-top: 0.25rem;
        margin-bottom: 0.75rem;
    }
    .action-box {
        background-color: #F8FAFC;
        border-left: 4px solid #3B82F6;
        padding: 0.6rem;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #1E293B;
        font-weight: 500;
        margin-bottom: 0.75rem;
    }
    .reasoning-box {
        background-color: #FEF2F2;
        border: 1px solid #FCA5A5;
        border-radius: 6px;
        padding: 0.75rem;
        font-size: 0.85rem;
        color: #7F1D1D;
    }
    .simulator-card {
        background-color: #F8FAFC;
        border: 1px solid #CBD5E1;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------
# Data Loader Functions (Cached)
# ---------------------------------------------------------
@st.cache_data
def load_datasets():
    data_dir = "data"
    if not os.path.exists(os.path.join(data_dir, "stores.csv")):
        generate_retail_data(output_dir=data_dir)

    df_stores = pd.read_csv(os.path.join(data_dir, "stores.csv"))
    df_products = pd.read_csv(os.path.join(data_dir, "products.csv"))
    df_inventory = pd.read_csv(os.path.join(data_dir, "inventory.csv"))
    df_sales = pd.read_csv(os.path.join(data_dir, "sales.csv"))
    return df_stores, df_products, df_inventory, df_sales


@st.cache_resource
def get_analytics_engine():
    return RetailAnalyticsEngine(data_dir="data")


# Load datasets & engine
df_stores, df_products, df_inventory, df_sales = load_datasets()
engine = get_analytics_engine()

# ---------------------------------------------------------
# Sidebar
# ---------------------------------------------------------
with st.sidebar:
    st.title("🛒 Copilot Control Panel")
    st.caption("AI-Powered Retail Sales & Inventory Copilot")

    st.divider()

    st.subheader("📊 Dataset Overview")
    st.write(f"• **Stores**: {len(df_stores)}")
    st.write(f"• **Products (SKUs)**: {len(df_products)}")
    st.write(f"• **Inventory Items**: {len(df_inventory)}")
    st.write(f"• **Sales Transactions**: {len(df_sales):,}")

    st.divider()

    if st.button("🔄 Regenerate Synthetic Data", width="stretch"):
        generate_retail_data(output_dir="data")
        st.cache_data.clear()
        st.cache_resource.clear()
        st.rerun()

    st.divider()
    st.caption("Built with Pandas, DuckDB, Streamlit & OpenAI GPT-4o-mini")

# ---------------------------------------------------------
# Main App Header
# ---------------------------------------------------------
st.markdown('<div class="main-header">Retail Sales & Inventory Copilot</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">Real-time inventory intelligence, risk alerts, scenario simulator & manager actions</div>',
    unsafe_allow_html=True,
)

# Fetch engine metrics
summary_metrics = engine.get_copilot_summary()
stockout_df = summary_metrics["stockout_alerts"]
deadstock_df = summary_metrics["deadstock_alerts"]
anomaly_df = summary_metrics["sales_anomalies"]

# Main Layout Navigation Tabs
tab_feed, tab_simulator, tab_copilot = st.tabs(
    ["🚨 Today's Attention Feed", "🧮 Scenario Simulator", "💬 Ask Copilot"]
)

# =========================================================
# TAB 1: Today's Attention Needed Feed
# =========================================================
with tab_feed:
    st.subheader("🚨 Today's Attention Needed Feed")
    st.write("Top 3 automated risk alerts requiring immediate retail manager action.")

    col1, col2, col3 = st.columns(3)

    # CARD 1: Stock-out Risk Alert
    with col1:
        if not stockout_df.empty:
            top_stockout = stockout_df.iloc[0]
            s_id = top_stockout["store_id"]
            p_id = top_stockout["sku_id"]
            prod_name = top_stockout["product_name"]
            store_name = top_stockout["store_name"]
            stock = int(top_stockout["current_stock"])
            lead = int(top_stockout["lead_time_days"])
            ads = top_stockout["ads"]
            dos = top_stockout["dos"]
            reorder_qty = max(20, int((lead * ads * 1.5) - stock))

            st.markdown(
                f"""
                <div class="feed-card">
                    <div class="card-title-stockout">🚨 Stock-out Risk Alert</div>
                    <div class="card-metric">{prod_name}</div>
                    <div class="card-subtext">Location: <b>{store_name}</b><br>Stock: <b>{stock} units</b> | ADS: <b>{ads:.1f}</b> | DOS: <b>{dos:.1f} days</b> (Lead Time: {lead}d)</div>
                    <div class="action-box">💡 <b>Recommended Action</b>: Reorder <b>{reorder_qty} units</b> immediately to prevent stockout.</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Feature 3: Explanation Modal ("Why this alert?")
            with st.expander("❓ Why this alert? (Explain Reasoning)"):
                st.markdown(
                    f"""
                    **Mathematical Breakdown**:
                    - **Formula Used**: $\\text{{DOS}} = \\frac{{\\text{{Current Stock ({stock})}}}}{{\\text{{ADS ({ads:.2f}/day)}}}} = {dos:.2f} \\text{{ Days}}$
                    - **Lead Time Threshold**: `{lead} Days`
                    - **Verdict**: 🚨 **High Stock-out Risk** (`{dos:.2f} days` supply left < `{lead} days` lead time). Stock will deplete before standard shipment arrives.
                    """
                )

            # Feature 2: One-Click "Manager Action" Generator
            po_text, po_csv = engine.generate_purchase_order_payload(
                store_id=s_id,
                store_name=store_name,
                sku_id=p_id,
                product_name=prod_name,
                reorder_qty=reorder_qty,
                unit_cost=80.0,  # unit cost lookup
            )
            with st.popover("📄 Generate Purchase Order Draft", width="stretch"):
                st.code(po_text, language="text")
                st.download_button(
                    label="⬇️ Download Purchase Order (CSV)",
                    data=po_csv.to_csv(index=False).encode("utf-8"),
                    file_name=f"PO_Draft_{s_id}_{p_id}.csv",
                    mime="text/csv",
                    width="stretch",
                )
        else:
            st.success("No critical stock-out risks detected.")

    # CARD 2: Deadstock Alert
    with col2:
        if not deadstock_df.empty:
            top_dead = deadstock_df.iloc[0]
            s_id = top_dead["store_id"]
            p_id = top_dead["sku_id"]
            prod_name = top_dead["product_name"]
            store_name = top_dead["store_name"]
            stock = int(top_dead["current_stock"])
            unit_cost = float(top_dead["unit_cost"])
            capital = top_dead["tied_up_capital"]
            dos = top_dead["dos"]
            reason = top_dead["deadstock_reason"]
            dos_text = f"{dos:.0f} days" if dos < 900 else ">90 days (0 sales)"

            # Estimate retail price (assume 2.5x unit cost for lookup)
            retail_price = round(unit_cost * 2.5, 2)

            st.markdown(
                f"""
                <div class="feed-card">
                    <div class="card-title-deadstock">⚠️ Deadstock Alert</div>
                    <div class="card-metric">${capital:,.2f} Capital Tied Up</div>
                    <div class="card-subtext">Item: <b>{prod_name}</b> at <b>{store_name}</b><br>Stock: <b>{stock} units</b> | DOS: <b>{dos_text}</b> ({reason})</div>
                    <div class="action-box">💡 <b>Recommended Action</b>: Apply <b>25% clearance discount</b> or reallocate stock to high-demand stores.</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Feature 3: Explanation Modal ("Why this alert?")
            with st.expander("❓ Why this alert? (Explain Reasoning)"):
                st.markdown(
                    f"""
                    **Mathematical Breakdown**:
                    - **Formula Used**: $\\text{{Tied-up Capital}} = \\text{{Stock ({stock})}} \\times \\text{{Unit Cost (${unit_cost:.2f})}} = \\${capital:,.2f}$
                    - **Condition Triggered**: `{reason}` (Sales in 30 Days = `0 units` | DOS = `{dos:.0f} days`)
                    - **Threshold**: DOS Threshold = `60 Days`
                    - **Verdict**: ⚠️ **Critical Deadstock Alert** (Non-moving inventory tying up working capital).
                    """
                )

            # Feature 2: One-Click "Manager Action" Generator
            memo_text = engine.generate_clearance_memo_payload(
                store_id=s_id,
                store_name=store_name,
                sku_id=p_id,
                product_name=prod_name,
                original_price=retail_price,
                discount_pct=25.0,
            )
            with st.popover("🏷️ Generate Clearance Markdown Note", width="stretch"):
                st.markdown(memo_text)
                st.download_button(
                    label="⬇️ Download Markdown Note (.md)",
                    data=memo_text.encode("utf-8"),
                    file_name=f"Clearance_Memo_{s_id}_{p_id}.md",
                    mime="text/markdown",
                    width="stretch",
                )
        else:
            st.success("No deadstock alerts detected.")

    # CARD 3: Sales Anomaly
    with col3:
        if not anomaly_df.empty:
            top_anomaly = anomaly_df.iloc[0]
            prod_name = top_anomaly["product_name"]
            store_name = top_anomaly["store_name"]
            date_str = str(top_anomaly["date"])
            daily_qty = int(top_anomaly["daily_qty"])
            mean_qty = float(top_anomaly["mean_qty"])
            std_qty = float(top_anomaly.get("std_qty", 1.5))
            z_score = float(top_anomaly["z_score"])

            st.markdown(
                f"""
                <div class="feed-card">
                    <div class="card-title-anomaly">📈 Sales Volume Anomaly</div>
                    <div class="card-metric">{daily_qty} Units Sold (+{z_score:.1f}σ)</div>
                    <div class="card-subtext">Item: <b>{prod_name}</b> at <b>{store_name}</b> ({date_str})<br>30-Day Mean: <b>{mean_qty:.1f} units/day</b></div>
                    <div class="action-box">💡 <b>Recommended Action</b>: Investigate promo/bulk buyer cause & adjust safety stock baseline.</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Feature 3: Explanation Modal ("Why this alert?")
            with st.expander("❓ Why this alert? (Explain Reasoning)"):
                threshold_val = mean_qty + 2.0 * std_qty
                st.markdown(
                    f"""
                    **Mathematical Breakdown**:
                    - **Formula Used**: $Z = \\frac{{\\text{{Daily Sales ({daily_qty})}} - \\text{{Mean ({mean_qty:.2f})}}}}{{\\text{{Std Dev ({std_qty:.2f})}}}} = +{z_score:.2f}\\sigma$
                    - **Anomaly Threshold**: $\\text{{Mean}} + 2.0 \\times \\text{{Std Dev}} = {threshold_val:.2f} \\text{{ units}}$
                    - **Verdict**: 📈 **Statistically Significant Volume Spike** (`{daily_qty} units` exceeds threshold of `{threshold_val:.2f} units`).
                    """
                )
        else:
            st.info("No recent sales anomalies detected.")

# =========================================================
# TAB 2: Interactive "What-If" Scenario Simulator
# =========================================================
with tab_simulator:
    st.subheader("🧮 Interactive 'What-If' Scenario Simulator")
    st.write("Simulate margin outcomes, clearance discount velocities, and express freight shipping trade-offs in real time.")

    sim_col1, sim_col2 = st.columns(2)

    # Simulator 1: Deadstock Clearance & Margin Simulator
    with sim_col1:
        st.markdown("### 🏷️ Deadstock Clearance Margin Calculator")
        st.caption("Adjust discount percentage to project freed working capital and remaining profit margin.")

        if not deadstock_df.empty:
            sel_dead_idx = st.selectbox(
                "Select Target Deadstock Item:",
                options=range(len(deadstock_df)),
                format_func=lambda i: f"{deadstock_df.iloc[i]['product_name']} ({deadstock_df.iloc[i]['store_name']}) - Stock: {deadstock_df.iloc[i]['current_stock']} units",
            )
            sel_item = deadstock_df.iloc[sel_dead_idx]
            stock_qty = int(sel_item["current_stock"])
            unit_cost = float(sel_item["unit_cost"])
            retail_price = round(unit_cost * 2.5, 2)  # Retail price estimation

            discount_pct = st.slider(
                "Clearance Discount (%)",
                min_value=0,
                max_value=75,
                value=25,
                step=5,
                help="Slide to simulate clearance pricing strategy.",
            )

            # Calculate simulation using engine helper
            sim_res = engine.calculate_clearance_scenario(
                current_stock=stock_qty,
                unit_cost=unit_cost,
                retail_price=retail_price,
                discount_pct=discount_pct,
            )

            st.markdown(
                f"""
                <div class="simulator-card">
                    <h4>Simulation Results ({discount_pct}% Discount):</h4>
                    <ul>
                        <li><b>Original Retail Price</b>: ${sim_res['original_price']:.2f}</li>
                        <li><b>New Discounted Price</b>: <span style="color:#2563EB; font-weight:bold;">${sim_res['discounted_price']:.2f}</span></li>
                        <li><b>Unit Cost</b>: ${sim_res['unit_cost']:.2f}</li>
                        <li><b>Profit per Unit</b>: ${sim_res['profit_per_unit']:.2f}</li>
                        <li><b>Total Freed Capital (Revenue)</b>: <span style="color:#059669; font-weight:bold;">${sim_res['total_freed_capital']:,.2f}</span></li>
                        <li><b>Total Projected Profit</b>: ${sim_res['total_projected_profit']:,.2f}</li>
                        <li><b>Projected Profit Margin</b>: <b>{sim_res['margin_pct']:.1f}%</b></li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.info("No deadstock items available for clearance simulation.")

    # Simulator 2: Express Freight vs. Stock-Out Cost Calculator
    with sim_col2:
        st.markdown("### ✈️ Express Freight Trade-off Calculator")
        st.caption("Calculate the net financial trade-off between stock-out lost sales vs. express air freight premium.")

        if not stockout_df.empty:
            sel_stock_idx = st.selectbox(
                "Select Target Low-Stock Item:",
                options=range(len(stockout_df)),
                format_func=lambda i: f"{stockout_df.iloc[i]['product_name']} ({stockout_df.iloc[i]['store_name']}) - Stock: {stockout_df.iloc[i]['current_stock']} units",
            )
            sel_stock_item = stockout_df.iloc[sel_stock_idx]
            curr_stock = int(sel_stock_item["current_stock"])
            ads_val = float(sel_stock_item["ads"])
            std_lead = int(sel_stock_item["lead_time_days"])
            est_retail = 199.99

            exp_lead = st.slider(
                "Express Shipping Lead Time (Days)",
                min_value=1,
                max_value=std_lead,
                value=max(2, std_lead // 3),
                help="Simulate expedited delivery time.",
            )

            exp_cost_per_unit = st.slider(
                "Express Freight Premium ($/unit)",
                min_value=1.0,
                max_value=25.0,
                value=6.0,
                step=0.5,
                help="Extra cost per unit for express freight.",
            )

            exp_res = engine.calculate_reorder_scenario(
                current_stock=curr_stock,
                ads=ads_val,
                lead_time_days=std_lead,
                express_lead_days=exp_lead,
                express_cost_per_unit=exp_cost_per_unit,
                retail_price=est_retail,
                unit_cost=80.0,
            )

            verdict_color = "#059669" if exp_res["recommend_express"] else "#DC2626"
            verdict_text = "EXPRESS SHIPPING RECOMMENDED (Saves Net Revenue)" if exp_res["recommend_express"] else "STANDARD REORDER RECOMMENDED (Express Cost Exceeds Lost Revenue)"

            st.markdown(
                f"""
                <div class="simulator-card">
                    <h4>Reorder Logistics Trade-off ({exp_res['reorder_qty']} Units):</h4>
                    <ul>
                        <li><b>Standard Lead Time ({std_lead}d) Lost Sales</b>: ${exp_res['std_lost_revenue']:,.2f}</li>
                        <li><b>Express Lead Time ({exp_lead}d) Lost Sales</b>: ${exp_res['express_lost_revenue']:,.2f}</li>
                        <li><b>Total Express Air Freight Cost</b>: ${exp_res['express_freight_cost']:,.2f}</li>
                        <li><b>Net Financial Benefit</b>: <span style="color:{verdict_color}; font-weight:bold;">${exp_res['net_express_benefit']:,.2f}</span></li>
                    </ul>
                    <div style="background-color:#F1F5F9; border-left: 4px solid {verdict_color}; padding:0.5rem; border-radius:4px; font-weight:bold; font-size:0.85rem; color:#0F172A;">
                        Verdict: {verdict_text}
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.info("No low-stock items available for express freight simulation.")

# =========================================================
# TAB 3: Ask Copilot Chat Interface
# =========================================================
with tab_copilot:
    st.subheader("💬 Ask Copilot")
    st.write("Ask natural language questions about your retail sales, stock levels, risks, and performance.")

    # Quick Suggestion Buttons
    st.markdown("**Quick Sample Questions:**")
    q_col1, q_col2, q_col3, q_col4 = st.columns(4)

    sample_query = None
    if q_col1.button("🚨 Low Stock Risks", width="stretch"):
        sample_query = "Which items are at risk of running out of stock?"
    if q_col2.button("📦 Deadstock Items", width="stretch"):
        sample_query = "Show me deadstock items that are not moving"
    if q_col3.button("📈 Sales Volume Spikes", width="stretch"):
        sample_query = "Were there any sales volume spikes or anomalies recently?"
    if q_col4.button("❓ Out of Scope Query", width="stretch"):
        sample_query = "What are our competitor prices and store footfall numbers?"

    # Chat History Session State Initialization
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "Hello Manager! I am your Retail Sales and Inventory Copilot. How can I assist you with your stock, sales, or inventory risk analysis today?",
                "show_work": None,
            }
        ]

    # Display past chat messages
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("show_work"):
                sw = msg["show_work"]
                with st.expander("View Data & Assumptions"):
                    st.markdown(f"**Assumptions & Formulas Used**:\n`{sw['assumptions']}`")
                    st.markdown("**Calculated Data Table Slice**:")
                    if isinstance(sw["data"], pd.DataFrame):
                        st.dataframe(sw["data"], width="stretch")
                    else:
                        st.code(str(sw["data"]))

    # Handle user input from chat input or quick suggestion buttons
    user_input = st.chat_input("Ask the Copilot a question...")
    query_to_process = sample_query if sample_query else user_input

    if query_to_process:
        st.session_state.messages.append({"role": "user", "content": query_to_process, "show_work": None})
        with st.chat_message("user"):
            st.markdown(query_to_process)

        with st.chat_message("assistant"):
            with st.spinner("Analyzing inventory metrics and computing deterministic queries..."):
                query_result = process_manager_query(
                    query_to_process,
                    df_inventory=df_inventory,
                    df_sales=df_sales,
                    df_products=df_products,
                    df_stores=df_stores,
                )
                copilot_response = generate_copilot_response(query_result, query_to_process)

            st.markdown(copilot_response)

            show_work_data = {
                "assumptions": query_result.get("assumptions_used", ""),
                "data": query_result.get("calculated_data"),
            }
            with st.expander("View Data & Assumptions"):
                st.markdown(f"**Assumptions & Formulas Used**:\n`{show_work_data['assumptions']}`")
                st.markdown("**Calculated Data Table Slice**:")
                if isinstance(show_work_data["data"], pd.DataFrame):
                    st.dataframe(show_work_data["data"], width="stretch")
                else:
                    st.code(str(show_work_data["data"]))

            st.session_state.messages.append(
                {
                    "role": "assistant",
                    "content": copilot_response,
                    "show_work": show_work_data,
                }
            )
