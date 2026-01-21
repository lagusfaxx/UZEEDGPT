import { Suspense } from "react";
import ExploreClient from "./ExploreClient";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="card p-6 md:p-8">Cargando explorar...</div>}>
      <ExploreClient />
    </Suspense>
  );
}
