export interface Upload{
  upload_tab?: string;
  upload_title?: string;
  select_tip?: string;
  drag_drop_text?: string;
  click_different_file?: string;
  support_format?: string;
}

export interface State{
  uploading?: string;
  analyzing?: string;
  processing?: string;
  detection_complete?: string;
  detect_ai_generation?: string;
  auth_required?: string;
}

export interface DetectResult{
  result_detail?: string;
  insufficient_credits?: string;
  unable_verify_credits?: string;
  invalid_file?: string;
  preview_failed?: string;
  detection_failed?: string;
  confidence_level?: string;
  ai_generated?: string;
  human_created?: string;
  analyze_again?: string;
  understand?: string;
  confidence_score_desc?: string;
  ai_generated_desc?: string;
  human_created_desc?: string;
  note?: string;
}

export interface Detection{
  uploads?: Upload[],
  state?: State,
  detectResult?: DetectResult
}
