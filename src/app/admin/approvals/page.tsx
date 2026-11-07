import { OrderApprovalCard, ReturnCard, ReviewCard } from "@/components/admin/approval-cards";
import { EmptyState, PageHeader, Tabs } from "@/components/admin/ui";
import type { ReturnStatus } from "@/lib/constants";
import {
  getPendingCounts,
  listOrdersAwaitingApproval,
  listReturns,
  listReviews,
  nextReturnStatuses,
} from "@/services/admin/approvals.service";

export const metadata = { title: "Approvals" };

type Tab = "orders" | "returns" | "reviews";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ tab?: string; show?: string }> }) {
  const sp = await searchParams;
  const tab: Tab = sp.tab === "returns" || sp.tab === "reviews" ? sp.tab : "orders";
  const showAll = sp.show === "all";
  const counts = await getPendingCounts();

  return (
    <>
      <PageHeader title="Approvals" description="Everything waiting on a decision from you: paid orders, return requests and new customer reviews." />
      <Tabs
        current={tab}
        items={[
          { value: "orders", label: "Orders", count: counts.orders, href: "/admin/approvals?tab=orders" },
          { value: "returns", label: "Returns", count: counts.returns, href: "/admin/approvals?tab=returns" },
          { value: "reviews", label: "Reviews", count: counts.reviews, href: "/admin/approvals?tab=reviews" },
        ]}
      />

      {tab === "orders" && <OrdersTab />}
      {tab === "returns" && <ReturnsTab showAll={showAll} />}
      {tab === "reviews" && <ReviewsTab showAll={showAll} />}
    </>
  );
}

async function OrdersTab() {
  const orders = await listOrdersAwaitingApproval();
  if (!orders.length) return <EmptyState title="All caught up">New paid orders will wait here for you to approve or reject.</EmptyState>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Oldest first. Approving emails the customer; rejecting cancels the order, restores stock and starts a refund.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((o) => <OrderApprovalCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

function ShowToggle({ tab, showAll, label }: { tab: Tab; showAll: boolean; label: string }) {
  return (
    <a href={`/admin/approvals?tab=${tab}${showAll ? "" : "&show=all"}`} className="inline-flex min-h-9 items-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
      {showAll ? "Show open only" : label}
    </a>
  );
}

async function ReturnsTab({ showAll }: { showAll: boolean }) {
  const returns = await listReturns(showAll ? "ALL" : "OPEN");
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ShowToggle tab="returns" showAll={showAll} label="Show closed returns too" /></div>
      {returns.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {returns.map((r) => <ReturnCard key={r.id} item={r} next={nextReturnStatuses(r.status as ReturnStatus)} />)}
        </div>
      ) : (
        <EmptyState title="No open return requests">Customers can request a return from a delivered order in their profile.</EmptyState>
      )}
    </div>
  );
}

async function ReviewsTab({ showAll }: { showAll: boolean }) {
  const reviews = await listReviews(showAll ? "ALL" : "PENDING");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Reviews stay hidden until you approve them. Only approved reviews count towards ratings.</p>
        <ShowToggle tab="reviews" showAll={showAll} label="Show all reviews" />
      </div>
      {reviews.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      ) : (
        <EmptyState title="No reviews waiting">Customers can review pieces once their order is delivered.</EmptyState>
      )}
    </div>
  );
}
