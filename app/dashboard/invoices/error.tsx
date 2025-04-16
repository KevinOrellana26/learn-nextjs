"use client";

import { useEffect } from "react";

export default function Error({
  error, //instancia nativa del Objeto Error de JavaScript
  reset, //funcion para restablecer el límite de error. Cuando se ejecuta, la función intentará volver a renderizar el segemento de ruta
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
        <h2 className="text-center">
            Something went wrong!
        </h2>
        <button
            className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
            onClick={() => reset()}
        >
            Try again
        </button>
    </main>
  )
}
