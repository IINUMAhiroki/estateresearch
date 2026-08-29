import { FileText } from "lucide-react";

export default function DisclosuresPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">決算資料</h1>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <FileText className="size-8" />
        <p>
          準備中です。決算報告PDFのビューア・LLMによる引用抽出機能は次のフェーズで実装予定です。
        </p>
      </div>
    </div>
  );
}
