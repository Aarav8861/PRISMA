import os
import matplotlib.pyplot as plt
import pandas as pd
import tempfile
from typing import List
from pydantic import BaseModel, ConfigDict, Field
from fpdf import FPDF
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver
from pathlib import Path
from datetime import datetime
from PyPDF2 import PdfReader, PdfWriter
from datetime import datetime

# Configuration
BASE_PATH = "C:\\Users\\Atharva\\Documents\\Reimagine\\PRISMA\\backend"
DATA_PATH = f"{BASE_PATH}\\synthetic_bank_data_with_transitions.xlsx"
REPORT_PATH = f"{BASE_PATH}\\reports\\report"
CHAT_MODEL = AzureChatOpenAI(
        azure_endpoint="https://hackathon-prisma-resource.cognitiveservices.azure.com/",
        api_version="2024-12-01-preview",
        deployment_name="o4-mini", 
        api_key="",
        streaming=True,
        max_completion_tokens=1000,
    )

solvency_label = {
    1: "Solvent",
    2: "Good",
    3: "Fair",
    4: "At Risk",
    5: "Insolvent"
}

class PrismaState(BaseModel):
    step: str = "ingest"
    data_path: str = DATA_PATH
    curr: dict = {}
    hist: pd.DataFrame = Field(default_factory=pd.DataFrame, exclude=True)
    trends: dict = {}
    metrics: dict = {}
    anomalies: List[str] = []
    report_path: str = ""
    suggestions: List[str] = []
    chat_history: List[str] = []
    user_question: str = ""
    response: str = "The given bank is solvent"
    solvency_scale: str = ""
    df: pd.DataFrame = Field(default_factory=pd.DataFrame, exclude=True)
    graph_paths: dict[str, str] = {}
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
def ingest_agent(state: PrismaState):
    if not os.path.exists(state.data_path):
        raise FileNotFoundError(f"Data file not found at {state.data_path}")
    
    state.df = pd.read_excel(state.data_path) if state.data_path.endswith(".xlsx") else pd.read_csv(state.data_path)
    state.df = state.df.rename(columns={
        "Tier 1 Capital Ratio": "Tier_1_Capital_Ratio",
        "Total Capital Ratio": "Total_Capital_Ratio",
        "CET1 Ratio": "CET1_Ratio",
        "Leverage Ratio": "Leverage_Ratio",
        "RoE": "RoE",
        "RoA": "RoA",
        "NIM": "NIM",
        "Loan-to-Deposit Ratio": "Loan_to_Deposit_Ratio",
        "NSFR": "NSFR",
        "NPL Ratio": "NPL_Ratio",
        "Coverage Ratio": "Coverage_Ratio",
        "Sovereign Ratio": "Sovereign_Exposure"})
    state.hist = state.df.iloc[:-1].reset_index(drop=True)
    state.curr = state.df.iloc[-1].to_dict()
    state.step = "calc"
    print("Current Metrics:", state.curr)
    return state

def sanitize(s: str) -> str:
    replacements = {
        "–": "-",   # en dash
        "—": "-",   # em dash
        "“": '"', "”": '"',  # double quotes
        "‘": "'", "’": "'",  # single quotes
        "…": "...",          # ellipsis
        "≥": ">=", "≤": "<=", # inequalities
        "×": "x",             # multiplication
        "•": "-",             # bullet
        "\u2003": " ",        # em space
        "\u2009": " ",        # thin space
        "\u2010": "-",
        "\u00A0": " ",        # non-breaking space
        "\u202F": " ",        # narrow no-break space
        "\u2060": "",         # word joiner (invisible)
    }

    for orig, repl in replacements.items():
        s = s.replace(orig, repl)

    return s.strip()

def getLLMResponse(prompt):
    return CHAT_MODEL.invoke([HumanMessage(content=prompt)]).content

def solvency_calc_agent(state: PrismaState):
    prompt = (
        f"Current metrics: {state.curr}\n\n"
        "You are a financial AI agent tasked with assessing the solvency of banks based on their current financial and operational metrics."
        "Given the following data for a bank, analyse and predict whether the bank is:\n"
        "1. Solvent\n2. Good\n3. Fair\n4. At Risk\n5. Insolvent\n\n"
        "Strictly Return only one integer, which must be a number from 1 to 5. No explanation needed. No extra text just the integer"
    )
    state.solvency_scale = getLLMResponse(prompt)
    print("Solvency Scale Value:", state.solvency_scale)
    return state

def plot_column_vs_date(df, column_name,output_path, date_column='Date'):
    """
    Plots the specified column against the date column in the DataFrame.

    Parameters:
    - df (pd.DataFrame): The DataFrame containing the data.
    - column_name (str): The name of the column to plot on the y-axis.
    - date_column (str): The name of the column to use for the x-axis (default is 'date').

    Returns:
    - None
    """
    if column_name not in df.columns:
        raise ValueError(f"Column '{column_name}' not found in DataFrame.")
    if date_column not in df.columns:
        raise ValueError(f"Date column '{date_column}' not found in DataFrame.")

    if not pd.api.types.is_datetime64_any_dtype(df[date_column]):
        df[date_column] = pd.to_datetime(df[date_column])

    df_sorted = df.sort_values(by=date_column)
    plt.figure(figsize=(12, 6))
    plt.plot(df_sorted[date_column], df_sorted[column_name], marker='o', linestyle='-')
    column_name = column_name.replace("_", " ")
    plt.title(f'{column_name} over Time')
    plt.xlabel('Date')
    plt.ylabel(column_name)
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    
def analysis_agent(state: PrismaState):
    prompt = (
        f"Historical metrics: {state.hist}\n"
        f"Current metrics: {state.curr}\n\n"
        "You are a financial AI agent tasked with assessing the solvency of banks based on their current financial and operational metrics. "
        f"The solvency calculated using current metrics is {solvency_label[int(state.solvency_scale)]}. "
        "Explain your reasoning using the most current metrics, historical metrics and suggest actions the bank could take to improve solvency. Answer in less than 1000 tokens"
    )
    state.response = sanitize(getLLMResponse(prompt))
    print("AI Response:", state.response)
    columns_to_plot = [
    "Tier_1_Capital_Ratio",
    "Total_Capital_Ratio",
    "CET1_Ratio",
    "Leverage_Ratio",
    "RoE",
    "RoA",
    "NIM",
    "Loan_to_Deposit_Ratio",
    "NSFR",
    "NPL_Ratio",
    "Coverage_Ratio",
    "Sovereign_Exposure"
    ]
    
    for col in columns_to_plot:
        graph_path = f"{BASE_PATH}\\graphs\\{col}.png"
        plot_column_vs_date(state.df, col, graph_path)
        state.graph_paths[col] = graph_path
    return state

def suggested_questions_agent(state: PrismaState):
    prompt = (
        f"Based on the following response, suggest one short, unique and relevant follow-up question.\n\n"
        f"Response: {state.response}\n\n"
    )
    
    questions = []

    for i in range(3):
        question = getLLMResponse(prompt)
        questions.append(question)
        if i == 0:
            prompt += "Do not repeat any of the following questions:\n"
        prompt += f"{i + 1}. {question}\n"
        print(prompt)
    state.suggestions = questions
    return state

def report_gen_agent(state: PrismaState):
    # Helper: draw footer with page number
    BLUE = (0, 173, 239)
    class PDF(FPDF):
        def __init__(self):
            super().__init__()
            self.show_footer = True

        def footer(self):
            if not self.show_footer:
                return
            self.set_y(-15)
            self.set_font("Arial", "I", 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 10, f"Page {self.page_no() - 2}", align="C")

    # 1) Build content PDF, track section starts
    pdf = PDF()
    pdf.set_auto_page_break(True, 15)
    section_pages = {}

    # COVER
    pdf.show_footer = False
    pdf.add_page()
    if Path("Barclays-Logo.png").exists():
        pdf.image("Barclays-Logo.png", x=18, y=8, w=50)
    pdf.set_font("Arial", "B", 20)
    pdf.set_text_color(*BLUE)
    pdf.ln(60)
    pdf.cell(0, 10, "Solvency Analysis Report", ln=True, align="C")
    raw = state.curr["Date"]
    dt  = raw.strftime("%Y-%m-%d %H:%M:%S")
    pdf.set_font("Arial", "", 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, f"Analysis Date: {dt}", ln=True, align="C")

    # TOC placeholder page
    pdf.add_page()

    # Enable footer after cover + TOC
    pdf.show_footer = True

    # CURRENT METRICS
    pdf.t_margin += 15
    pdf.add_page()
    section_pages["Current Metrics"] = pdf.page_no()

    # Section title
    pdf.set_font("Arial", "", 25)
    pdf.set_text_color(*BLUE)

    # Calculate table width and x_start for centering
    w = pdf.w - pdf.l_margin - pdf.r_margin - 30
    col_sn = w * 0.06         
    col_metric = w * 0.47     
    col_value = w * 0.52     
    x_start = ((pdf.w - w) / 2) - col_sn

    # Align section title with the Metric column
    pdf.set_x(x_start + col_sn)
    pdf.cell(col_metric, 10, "Current Metrics", ln=True, align="L")
    pdf.ln(7)

    # Table Header
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", "B", 12)
    lh = pdf.font_size + 6

    pdf.set_x(x_start)
    pdf.cell(col_sn,     lh, "",           border="", align="L", fill=False)
    pdf.cell(col_metric, lh, "  Metric",   border="", align="L", fill=True)
    pdf.cell(col_value,  lh, "Value  ",    border="", align="R", fill=True)
    pdf.ln(lh)

    # Data rows
    pdf.set_fill_color(255, 255, 255)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Arial", "", 11)
    row_h = pdf.font_size + 6

    i = 1
    for key, val in state.curr.items():
        if key == "Date":
            continue
        pdf.set_x(x_start)
        pdf.cell(col_sn,     row_h, str(i),                 border="", align="C")
        pdf.cell(col_metric, row_h, "  " + key.replace("_", " "), border="B", align="L")
        pdf.cell(col_value,  row_h, f"{val}  ",             border="B", align="R")
        pdf.ln(row_h)
        i += 1

    y = pdf.get_y()
    pdf.set_draw_color(0, 0, 0)
    pdf.line(x_start + col_sn, y, x_start + w, y)
    pdf.ln(4)

    # AI SUMMARY
    pdf.add_page()

    margin = 25.4
    pdf.set_margins(margin, margin, margin)
    pdf.set_auto_page_break(auto=True, margin=margin)

    section_pages["AI Analysis"] = pdf.page_no()

    pdf.set_font("Arial", "", 25)
    pdf.set_text_color(*BLUE)
    pdf.set_x(margin)
    usable_width = pdf.w - 2 * margin
    pdf.cell(usable_width, 10, "AI Analysis", ln=True, align="L")

    pdf.ln(7)
    pdf.set_font("Arial", "", 12)
    pdf.set_text_color(0, 0, 0)
    for para in state.response.split("\n\n"):
        pdf.multi_cell(0, 8, para.strip())
        pdf.ln(2)

    # GRAPHS (2 per page)
    graphs = list(state.graph_paths.items())
    if graphs:
        for i in range(0, len(graphs), 2):
            pdf.add_page()
            if "Graphs" not in section_pages:
                section_pages["Graphs"] = pdf.page_no()

                pdf.set_font("Arial", "", 25)
                pdf.set_text_color(*BLUE)
                margin = pdf.l_margin
                usable_width = pdf.w - pdf.l_margin - pdf.r_margin
                pdf.set_x(margin)
                pdf.cell(usable_width, 15, "Metric Trends", ln=True, align="L")
                pdf.ln(8)

            for j in (0, 1):
                idx = i + j
                if idx < len(graphs):
                    title, path = graphs[idx]
                    if Path(path).exists():
                        pdf.set_font("Arial", "B", 12)
                        pdf.set_text_color(0, 0, 0)
                        pdf.set_fill_color(220, 220, 220)
                        pdf.set_x(pdf.l_margin)
                        usable_width = pdf.w - pdf.l_margin - pdf.r_margin
                        pdf.cell(usable_width, 8, title.replace("_", " "), ln=True, fill=True)
                        pdf.image(path, x=pdf.l_margin, w=usable_width)
                        pdf.ln(20)

    # Save content to temp PDF
    tmp_content = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    pdf.output(tmp_content.name)
    tmp_content.close()

    # TOC generation
    reader = PdfReader(tmp_content.name)
    total = len(reader.pages)

    toc = FPDF()
    toc.set_auto_page_break(False)
    toc.add_page()
    toc.set_font("Arial", "", 25)
    toc.set_text_color(*BLUE)
    toc.set_xy(35, 55)
    toc.cell(0, 10, "Contents")
    toc.ln(6)
    toc.set_font("Arial", "", 12)
    toc.set_text_color(0, 0, 0)

    start_x, start_y, lh = 35, 70, 8
    entries = [
        ("Current Metrics", section_pages.get("Current Metrics", 3) - 2),
        ("AI Summary",      section_pages.get("AI Analysis", 4) - 2),
        ("Metric Trends",   section_pages.get("Graphs",       total) - 2),
    ]
    for idx, (title, pg) in enumerate(entries):
        y = start_y + idx * lh
        toc.set_xy(start_x, y)
        toc.cell(80, lh, title)
        toc.set_xy(130, y)
        toc.cell(20, lh, str(pg), align="R")

    toc.set_y(-15)
    toc.set_font("Arial", "I", 8)
    toc.set_text_color(100, 100, 100)
    toc.cell(0, 10, "", align="C")

    tmp_toc = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    toc.output(tmp_toc.name)
    tmp_toc.close()

    # Merge cover + TOC + content
    writer = PdfWriter()
    content_reader = PdfReader(tmp_content.name)
    toc_reader = PdfReader(tmp_toc.name)

    writer.add_page(content_reader.pages[0])  # Cover
    writer.add_page(toc_reader.pages[0])      # TOC
    for p in content_reader.pages[2:]:        # Skip cover and TOC
        writer.add_page(p)

    final = f"{REPORT_PATH}_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.pdf"
    with open(final, "wb") as f:
        writer.write(f)

    Path(tmp_content.name).unlink()
    Path(tmp_toc.name).unlink()

    state.report_path = final
    state.step = "chat"
    print(f"Report saved to: {final}")
    return state

def chatbot_agent(prompt: str, checkpointer: InMemorySaver):
    msg = {"messages": [HumanMessage(content=prompt)]}
    
    agent = create_react_agent(
        model=CHAT_MODEL,
        tools=[],
        checkpointer=checkpointer 
    )
    
    config = {
        "configurable": {
            "thread_id": "1"  
        }
    }
    
    # Invoke and stream
    for token, metadata in agent.stream(msg, config, stream_mode="messages"):
        if hasattr(token, "content"):
            yield token.content