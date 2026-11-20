import type { ReactNode } from "react"

/*
 * Temporary markers for the legal texts awaiting approval (SPEC-PORTAL-001, R1.7).
 * After approval: remove <ApprovalNotice /> from the pages and replace every <Pending>
 * with the approved text. `grep -rn "Pending\|ApprovalNotice" app` lists every use.
 */

export function ApprovalNotice() {
  return (
    <p
      role="note"
      data-testid="approval-notice"
      className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50"
    >
      Versão para aprovação — itens marcados [proposta] ou [a confirmar] dependem de decisão do
      responsável.
    </p>
  )
}

/** Visible marker for a point that still depends on a decision. */
export function Pending({
  kind,
  children,
}: {
  kind: "proposta" | "a confirmar"
  children?: ReactNode
}) {
  return (
    <strong className="font-semibold text-amber-800 dark:text-amber-300">
      [{kind}
      {children ? <>: {children}</> : null}]
    </strong>
  )
}
