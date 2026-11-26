import { Router } from "express";
import {
  createInvoice,
  getInvoiceDetails,
  listInvoices,
} from "@/controllers/invoice.controller";

export const invoiceRouter = Router();

invoiceRouter.get("/", listInvoices);
invoiceRouter.post("/", createInvoice);
invoiceRouter.get("/:id", getInvoiceDetails);
