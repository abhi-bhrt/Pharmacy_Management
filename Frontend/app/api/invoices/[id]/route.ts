// app/api/invoices/[id]/route.ts
import { getPublicInvoiceByIdService, type PublicInvoicePublicResponse } from "@/services/invoices";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";

export const GET = withApiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const invoice: PublicInvoicePublicResponse = await getPublicInvoiceByIdService(id);

    return sendSuccess<{ invoice: PublicInvoicePublicResponse }>({ invoice });
  }
);