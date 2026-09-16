import { redirect } from "next/navigation";

/** Legacy shelf-gap suggested orders → Demand Planning (PDF Process I). */
export default function SuggestedOrdersRedirectPage() {
  redirect("/orders/demand-planning");
}
