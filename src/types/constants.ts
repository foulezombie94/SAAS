export const Constants = {
  public: {
    Enums: {
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "invoiced",
        "paid",
        "overdue",
        "cancelled",
        "expired",
      ],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "overdue",
        "cancelled",
      ],
    },
  },
} as const
