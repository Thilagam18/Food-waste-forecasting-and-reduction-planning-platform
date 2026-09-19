import os
from typing import Any, Dict
import pandas as pd

try:
    import openai
except ImportError:
    openai = None


COPILOT_SYSTEM_PROMPT = """You are an expert Retail Sales and Inventory Copilot assisting a retail manager.
Your task is to convert pre-calculated analytics data into a clear, executive, and actionable conversational response.

STRICT GUARDRAILS:
1. MANDATORY: Include actual pre-calculated numbers and figures behind every claim (e.g., exact stock levels, ADS, DOS, lead times, tied-up capital, z-scores, daily quantities).
2. ACTIONABLE RECOMMENDATIONS:
   - For stock-out risk alerts: ALWAYS include a concrete recommended action (e.g., "Reorder X units immediately to maintain safety stock and cover lead time").
   - For deadstock alerts: ALWAYS include a concrete recommended action (e.g., "Apply a 25% discount, run a promotional bundle, or transfer stock to high-performing stores").
3. NO CALCULATIONS: NEVER perform math calculations inside your response. Rely ONLY on the pre-calculated numbers provided in the input payload.
4. GROUNDING & FALLBACK: If the payload indicates DATA_UNAVAILABLE or is_grounded is False, respond EXACTLY with:
   "I cannot answer this question as competitor/external data is not available."
5. TONE: Professional, concise, data-driven, and executive-ready. Format using Markdown bullet points and bold highlights.
"""


def format_calculated_data_for_prompt(calculated_data: Any) -> str:
    """Formats the calculated_data table into a Markdown string for the LLM prompt."""
    if isinstance(calculated_data, pd.DataFrame):
        if calculated_data.empty:
            return "No matching records found for the given criteria."
        try:
            return calculated_data.to_markdown(index=False)
        except Exception:
            return calculated_data.to_string(index=False)
    elif isinstance(calculated_data, (dict, list)):
        return str(calculated_data)
    else:
        return str(calculated_data)


def generate_fallback_response(query_result: Dict[str, Any], original_query: str) -> str:
    """
    Generates a deterministic rule-based response following all guardrails when OpenAI API is unconfigured.
    """
    is_grounded = query_result.get("is_grounded", False)
    calculated_data = query_result.get("calculated_data")
    assumptions = query_result.get("assumptions_used", "")

    if not is_grounded or (isinstance(calculated_data, str) and calculated_data == "DATA_UNAVAILABLE"):
        return "I cannot answer this question as competitor/external data is not available."

    if not isinstance(calculated_data, pd.DataFrame) or calculated_data.empty:
        return f"**Summary**: No items matched the query criteria.\n\n*Assumptions Used*: {assumptions}"

    df = calculated_data
    lines = [f"### Retail Copilot Analysis\n", f"**Assumptions Used**: {assumptions}\n"]

    if "dos" in df.columns and "lead_time_days" in df.columns and any(df["dos"] < df["lead_time_days"]):
        lines.append("#### [STOCK-OUT ALERT] Stock-out Risk Items Identified:")
        for _, row in df.iterrows():
            store = row.get("store_name", row.get("store_id", "Store"))
            prod = row.get("product_name", row.get("sku_id", "Product"))
            stock = row.get("current_stock", 0)
            lead = row.get("lead_time_days", 0)
            ads = row.get("ads", 0.0)
            dos = row.get("dos", 0.0)
            recommended_reorder = int((lead * ads * 1.5) - stock)
            if recommended_reorder < 10:
                recommended_reorder = 20

            lines.append(
                f"- **{prod}** at **{store}**: Current Stock: **{stock} units**, ADS: **{ads:.2f} units/day**, DOS: **{dos:.2f} days** (Lead Time: **{lead} days**).\n"
                f"  - **Recommended Action**: Reorder **{recommended_reorder} units** immediately to prevent stock-out before lead time expires."
            )

    elif "tied_up_capital" in df.columns or "deadstock_reason" in df.columns:
        lines.append("#### [DEADSTOCK ALERT] Slow-Moving / Deadstock Items Identified:")
        for _, row in df.head(5).iterrows():
            store = row.get("store_name", row.get("store_id", "Store"))
            prod = row.get("product_name", row.get("sku_id", "Product"))
            stock = row.get("current_stock", 0)
            capital = row.get("tied_up_capital", 0.0)
            dos = row.get("dos", 0.0)
            reason = row.get("deadstock_reason", "Excess Inventory")

            lines.append(
                f"- **{prod}** at **{store}**: Current Stock: **{stock} units**, Tied-up Capital: **${capital:,.2f}**, DOS: **{dos:.1f} days** ({reason}).\n"
                f"  - **Recommended Action**: Apply a **20-30% discount**, introduce promotional bundling, or reallocate excess inventory to higher velocity locations."
            )

    elif "z_score" in df.columns:
        lines.append("#### [SALES ANOMALY ALERT] Volume Spikes Identified:")
        for _, row in df.head(5).iterrows():
            store = row.get("store_name", row.get("store_id", "Store"))
            prod = row.get("product_name", row.get("sku_id", "Product"))
            date_val = row.get("date", "N/A")
            daily_qty = row.get("daily_qty", 0)
            mean_qty = row.get("mean_30d_qty", 0.0)
            z_score = row.get("z_score", 0.0)

            lines.append(
                f"- **{date_val}** - **{prod}** at **{store}**: Volume Sold: **{daily_qty} units** vs 30-day Mean: **{mean_qty} units** (Z-Score: **{z_score}**).\n"
                f"  - **Recommended Action**: Investigate driver of sales surge (marketing campaign or bulk buy) and adjust safety stock targets if trend continues."
            )

    else:
        lines.append("#### Inventory & Sales Metrics:")
        lines.append(df.head(10).to_markdown(index=False))

    return "\n".join(lines)


def generate_copilot_response(query_result: Dict[str, Any], original_query: str = "") -> str:
    """
    Takes the dictionary output from process_manager_query() and produces a guardrailed,
    conversational manager response.
    """
    is_grounded = query_result.get("is_grounded", False)
    calculated_data = query_result.get("calculated_data")

    # Guardrail: Check for unavailable / out-of-scope data first
    if not is_grounded or (isinstance(calculated_data, str) and calculated_data == "DATA_UNAVAILABLE"):
        return "I cannot answer this question as competitor/external data is not available."

    formatted_table = format_calculated_data_for_prompt(calculated_data)
    assumptions = query_result.get("assumptions_used", "")

    api_key = os.environ.get("OPENAI_API_KEY")

    if openai and api_key:
        try:
            client = openai.OpenAI(api_key=api_key)
            user_prompt = f"""
Manager's Query: "{original_query}"

Pre-Calculated Analytics Result Table:
{formatted_table}

Assumptions & Parameters Used:
{assumptions}

Generate an executive, data-backed conversational response following all system guardrails.
"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            content = response.choices[0].message.content
            if content:
                return content
        except Exception:
            # Fall back to deterministic guardrailed generator if API call fails
            pass

    # Execute fallback response generator
    return generate_fallback_response(query_result, original_query)


if __name__ == "__main__":
    print("=" * 60)
    print("RETAIL COPILOT LLM MODULE - GUARDRAIL TEST")
    print("=" * 60)

    # Test cases matching query_engine.py outputs
    test_cases = [
        {
            "name": "Stock-out Risk Query",
            "query": "Which items are at risk of running out of stock?",
            "query_result": {
                "calculated_data": pd.DataFrame([
                    {
                        "store_id": "STR-001",
                        "store_name": "Downtown Flagship",
                        "sku_id": "SKU-1001",
                        "product_name": "Noise-Canceling Headphones",
                        "current_stock": 15,
                        "lead_time_days": 10,
                        "ads": 8.97,
                        "dos": 1.67,
                    }
                ]),
                "assumptions_used": "ADS computed over 30-day window. Stock-out Risk: DOS < lead_time_days.",
                "is_grounded": True,
            },
        },
        {
            "name": "Deadstock Query",
            "query": "What items are deadstock in our stores?",
            "query_result": {
                "calculated_data": pd.DataFrame([
                    {
                        "store_id": "STR-001",
                        "store_name": "Downtown Flagship",
                        "sku_id": "SKU-4004",
                        "product_name": "Legacy Seasonal Decorative Vase",
                        "current_stock": 250,
                        "unit_cost": 22.0,
                        "tied_up_capital": 5500.0,
                        "dos": 999.0,
                        "deadstock_reason": "ZERO_SALES_30D",
                    }
                ]),
                "assumptions_used": "Deadstock condition: 0 sales in last 30 days OR DOS > 60 days.",
                "is_grounded": True,
            },
        },
        {
            "name": "Out-of-Scope Query",
            "query": "What are our competitor prices?",
            "query_result": {
                "calculated_data": "DATA_UNAVAILABLE",
                "assumptions_used": "Query asks for data outside internal inventory & sales scope.",
                "is_grounded": False,
            },
        },
    ]

    for tc in test_cases:
        print(f"\n--- TEST: {tc['name']} ---")
        print(f"User Query: '{tc['query']}'")
        resp = generate_copilot_response(tc["query_result"], tc["query"])
        print("Generated Response:\n")
        print(resp)
        print("-" * 40)
