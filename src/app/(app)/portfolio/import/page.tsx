import { ImportWizard } from "./import-wizard";

export default function PortfolioImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">CSVインポート</h1>
        <p className="text-sm text-muted-foreground">
          証券会社の取引履歴CSVから保有REITを一括登録する。列の対応を確認・修正してからインポートできる。
        </p>
      </div>

      <ImportWizard />
    </div>
  );
}
