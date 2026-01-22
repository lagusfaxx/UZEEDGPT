"use client";

type FloatingCreateButtonProps = {
  onClick: () => void;
};

export default function FloatingCreateButton({ onClick }: FloatingCreateButtonProps) {
  return (
    <button
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-fuchsia-500 text-3xl text-white shadow-lg transition hover:bg-fuchsia-400"
      onClick={onClick}
      aria-label="Crear publicación"
      type="button"
    >
      +
    </button>
  );
}
