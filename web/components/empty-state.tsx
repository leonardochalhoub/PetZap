type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-stone-900 dark:text-zinc-50">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-stone-600 dark:text-zinc-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
