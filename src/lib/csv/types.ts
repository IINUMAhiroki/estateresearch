export type ParsedPortfolioRow = {
  securitiesCode: string;
  transactionType: "buy" | "sell";
  quantityUnits: number;
  pricePerUnitYen: number;
  transactionDate: string;
};

export type CsvParseResult = {
  rows: ParsedPortfolioRow[];
  errors: string[];
};
