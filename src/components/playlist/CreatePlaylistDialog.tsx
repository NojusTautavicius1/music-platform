"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createPlaylist } from "@/app/actions/playlist";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().max(200, "Max 200 characters").optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  children?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreatePlaylistDialog({ children, open, onOpenChange }: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dialogOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", isPublic: false },
  });

  const description = watch("description") ?? "";
  const isPublic = watch("isPublic");

  useEffect(() => {
    if (!dialogOpen) {
      reset();
      setSubmitError(null);
    }
  }, [dialogOpen, reset]);

  const descriptionCount = useMemo(() => description.length, [description]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const result = await createPlaylist(values);
      if (result.ok) {
        setOpen(false);
        toast.success("Playlist created");
        router.push(`/library/playlist/${result.id}`);
      } else {
        setSubmitError(result.error);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create playlist");
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children} />}
      <DialogContent className="bg-[#18181F] border-white/10 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-100">
            Create playlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
          {submitError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {submitError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="pl-name">
              Name <span className="text-brand-orange">*</span>
            </label>
            <Input
              id="pl-name"
              autoFocus
              placeholder="My awesome playlist"
              className="bg-white/5 border-white/15 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/40"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-brand-orange">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300" htmlFor="pl-desc">
                Description
              </label>
              <span className="text-xs text-zinc-500">{descriptionCount}/200</span>
            </div>
            <Textarea
              id="pl-desc"
              placeholder="Optional description..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-brand-orange">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-300">Make public</p>
              <p className="text-xs text-zinc-500">Anyone can see this playlist</p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
