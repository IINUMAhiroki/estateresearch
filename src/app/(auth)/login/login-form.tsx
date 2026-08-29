"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "8文字以上で入力してください")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setPending(true);
    const supabase = createClient();

    try {
      if (mode === "magic-link") {
        const { error } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success(
          "ログイン用のメールを送信しました。受信箱を確認してください。",
        );
        return;
      }

      if (!values.password) {
        toast.error("パスワードを入力してください");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        toast.success(
          "確認メールを送信しました。メール内のリンクから認証してください。",
        );
        return;
      }

      window.location.href = "/notes";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ログインに失敗しました",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            未登録のメールアドレスの場合は自動的に新規登録します。
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {mode === "password" ? "ログイン / 新規登録" : "ログインリンクを送信"}
      </Button>

      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
      >
        {mode === "password"
          ? "代わりにマジックリンクでログイン"
          : "代わりにパスワードでログイン"}
      </button>
    </form>
  );
}
