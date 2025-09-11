export interface Upload{
  upload_tab?: string;
  upload_title?: string;
  select_tip?: string;
  drag_drop_text?: string;
  click_different_file?: string;
  support_format?: string;
  duration_limit_tip?: string;
  text_input_placeholder?: string;
  text_input_label?: string;
  file_upload_label?: string;
  word_count?: string;
  min_words_tip?: string;
}

export interface State{
  uploading?: string;
  analyzing?: string;
  processing?: string;
  detection_complete?: string;
  detect_ai_generation?: string;
  auth_required?: string;
}

export interface UnwatermarkResult{
  resulthints?: string;
  downloadtips?: string;
  downloadButton?: string;
  invalid_file?: string;
  preview_failed?: string;
  unwatermark_failed?: string;
  result_detail?: string;
  insufficient_credits?: string;
  unable_verify_credits?: string;
}


export interface Unwatermark {
  uploads?: Upload[],
  state?: State,
  unwatermarkResult?: UnwatermarkResult
}
