import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default function ResponsiveAudit() {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  return <main style={{maxWidth:"none",padding:16}}><h1>OpsHR responsive audit</h1><p>Preview-only layout checks. Data is synthetic.</p><div style={{display:"flex",gap:16,alignItems:"start"}}>{[320,390,768].map(width=><section key={width}><h2>{width} CSS pixels</h2><iframe title={`OpsHR ${width}`} src="/" width={width} height={1000} style={{border:"1px solid #ccc",boxSizing:"content-box"}} /></section>)}</div></main>;
}
