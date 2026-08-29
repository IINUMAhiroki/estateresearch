import { createClient } from "@/lib/supabase/server";
import { DeleteNoteButton } from "./delete-note-button";
import { NoteForm } from "./note-form";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("research_notes")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">マイノート</h1>
        <p className="text-sm text-muted-foreground">
          自分だけに見えるリサーチメモ（RLS で他ユーザーからは不可視）。
        </p>
      </div>

      <NoteForm />

      <ul className="space-y-3">
        {notes?.map((note) => (
          <li key={note.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">{note.title}</h2>
                {note.body && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {note.body}
                  </p>
                )}
              </div>
              <DeleteNoteButton id={note.id} />
            </div>
          </li>
        ))}
        {notes?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            まだノートがありません。
          </p>
        )}
      </ul>
    </div>
  );
}
