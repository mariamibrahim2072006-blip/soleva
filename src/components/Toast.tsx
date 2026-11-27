import { useStore } from '../store';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="fixed top-24 inset-x-0 z-[9000] flex justify-center pointer-events-none">
      <div className="bg-ivory text-ink text-sm px-6 py-3 tracking-wide uppercase font-display font-medium">{toast}</div>
    </div>
  );
}
