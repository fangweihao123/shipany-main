import { Button } from "@/types/blocks/base/button";

export interface PricingGroup {
  name?: string;
  title?: string;
  description?: string;
  label?: string;
  is_featured?: boolean;
}

export interface PricingItem {
  title?: string;
  description?: string;
  label?: string;
  price?: string;
  original_price?: string;
  currency?: string;
  unit?: string;
  features_title?: string;
  features?: string[];
  button?: Button;
  tip?: string;
  is_featured?: boolean;
  interval: "month" | "year" | "one-time";
  product_id: string;
  product_name?: string;
  amount: number;
  cn_amount?: number;
  currency: string;
  credits?: number;
  valid_months?: number;
  group?: string;
}

export interface CreditUseage {
  annualTotal?: {
    prefix?: string;  // "年度总价：" / "Annual total:"
    suffix?: string;  // "/ 年" / "/ year"
  };
  cnPayment?: {
    label?: string;   // "人民币支付 👉" / "CNY Payment 👉"
  };
  userNotice?: {
    creditsUsage?: {
      label?: string;  // "积分消费说明：" / "Credits Usage:"
      text?: string;   // "每生成一张图片消耗 2 个积分。" / "Each image generation consumes 2 credit."
    };
    cancellation?: {
      label?: string;  // "取消政策：" / "Cancellation:"
      text?: string;   // "随时可以取消订阅，无任何违约金。" / "Cancel anytime without any penalties or fees."
    };
  };
}

export interface Pricing {
  disabled?: boolean;
  name?: string;
  title?: string;
  description?: string;
  items?: PricingItem[];
  groups?: PricingGroup[];
  creditusage?: CreditUseage;
}
