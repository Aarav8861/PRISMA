import { ReactElement, ReactNode } from "react"

export interface AnalysisResponse {
    solvency_scale: string,
    analysis_summary: string,
    suggested_questions: string[],
    graph_paths: GraphPaths
}

interface GraphPaths {
    Tier_1_Capital_Ratio: string,
    Total_Capital_Ratio: string,
    CET1_Ratio: string,
    Leverage_Ratio: string,
    RoE: string,
    RoA: string,
    NIM: string,
    Loan_to_Deposit_Ratio: string,
    NSFR: string,
    NPL_Ratio: string,
    Coverage_Ratio: string,
    Sovereign_Exposure: string
}

export interface ChatMessage{
    key: string,
    status?: null | 'loading' | 'error' | 'success',
    message: string | ReactElement,
    personna: "user" | "prisma",
    suggestions?: string[],
    stream?: ReactElement 
} 
