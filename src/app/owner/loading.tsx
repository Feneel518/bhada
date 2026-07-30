export default function OwnerLoading() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] p-5 sm:p-8 lg:p-10" aria-busy="true">
      <div className="mx-auto max-w-[1400px] animate-pulse">
        <div className="h-16 rounded-2xl bg-white" />
        <div className="mt-8 h-10 w-72 rounded-lg bg-[#e8e9ef]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-2xl bg-white" />)}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_0.7fr]">
          <div className="h-80 rounded-2xl bg-white" />
          <div className="h-80 rounded-2xl bg-white" />
        </div>
      </div>
    </main>
  );
}
