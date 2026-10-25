using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TekFlow.Api.Data;
using TekFlow.Api.Entities;

namespace TekFlow.Api.Services;

public class ExportService
{
    private readonly AppDbContext _context;

    public ExportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Invoice?> GetInvoiceForExportAsync(int invoiceId)
    {
        return await _context.Invoices
            .Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == invoiceId);
    }

    public async Task<byte[]> GeneratePdfAsync(int invoiceId)
    {
        var invoice = await GetInvoiceForExportAsync(invoiceId);
        if (invoice is null)
        {
            throw new KeyNotFoundException("Invoice does not exist.");
        }

        var currentStatus = invoice.Status.ToString();
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(36);
                page.Size(PageSizes.A4);
                page.Content().Column(column =>
                {
                    column.Item().PaddingBottom(12).Text("TekFlow").SemiBold().FontSize(24);

                    column.Item().PaddingBottom(20).AlignRight().Text(text =>
                    {
                        text.Span("Invoice").SemiBold();
                        text.Span(" #" + invoice.InvoiceNumber).FontSize(16);
                    });

                    column.Item().Border(1).Padding(12).Column(inner =>
                    {
                        inner.Item().Text(text =>
                        {
                            text.Span("Invoice Number: ").SemiBold();
                            text.Span(invoice.InvoiceNumber);
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Issue Date: ").SemiBold();
                            text.Span(invoice.IssueDate.ToString("yyyy-MM-dd"));
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Client Name: ").SemiBold();
                            text.Span(invoice.Client.Name);
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Client Address: ").SemiBold();
                            text.Span(invoice.Client.Address);
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Client City: ").SemiBold();
                            text.Span(invoice.Client.City);
                        });
                        if (!string.IsNullOrWhiteSpace(invoice.Client.ContactName))
                        {
                            inner.Item().Text(text =>
                            {
                                text.Span("Contact Name: ").SemiBold();
                                text.Span(invoice.Client.ContactName);
                            });
                        }
                        if (!string.IsNullOrWhiteSpace(invoice.Client.Phone))
                        {
                            inner.Item().Text(text =>
                            {
                                text.Span("Phone: ").SemiBold();
                                text.Span(invoice.Client.Phone);
                            });
                        }
                        inner.Item().Text(text =>
                        {
                            text.Span("Amount: ").SemiBold();
                            text.Span(invoice.Amount.ToString("C2"));
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Description: ").SemiBold();
                            text.Span(invoice.Description ?? string.Empty);
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Status: ").SemiBold();
                            text.Span(currentStatus);
                        });
                        inner.Item().Text(text =>
                        {
                            text.Span("Created At: ").SemiBold();
                            text.Span(invoice.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"));
                        });
                    });
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateExcelAsync(int invoiceId)
    {
        var invoice = await GetInvoiceForExportAsync(invoiceId);
        if (invoice is null)
        {
            throw new KeyNotFoundException("Invoice does not exist.");
        }

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Invoice");

        worksheet.Cell("A1").Value = "Invoice Number";
        worksheet.Cell("B1").Value = invoice.InvoiceNumber;
        worksheet.Cell("A2").Value = "Issue Date";
        worksheet.Cell("B2").Value = invoice.IssueDate.ToString("yyyy-MM-dd");
        worksheet.Cell("A3").Value = "Client Name";
        worksheet.Cell("B3").Value = invoice.Client.Name;
        worksheet.Cell("A4").Value = "Client Address";
        worksheet.Cell("B4").Value = invoice.Client.Address;
        worksheet.Cell("A5").Value = "Client City";
        worksheet.Cell("B5").Value = invoice.Client.City;
        worksheet.Cell("A6").Value = "Contact Name";
        worksheet.Cell("B6").Value = invoice.Client.ContactName ?? string.Empty;
        worksheet.Cell("A7").Value = "Phone";
        worksheet.Cell("B7").Value = invoice.Client.Phone ?? string.Empty;
        worksheet.Cell("A8").Value = "Amount";
        worksheet.Cell("B8").Value = invoice.Amount;
        worksheet.Cell("A9").Value = "Description";
        worksheet.Cell("B9").Value = invoice.Description ?? string.Empty;
        worksheet.Cell("A10").Value = "Status";
        worksheet.Cell("B10").Value = invoice.Status.ToString();
        worksheet.Cell("A11").Value = "Created At";
        worksheet.Cell("B11").Value = invoice.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");

        worksheet.Range("A1:B11").Style.Font.Bold = true;
        worksheet.Column(1).Width = 22;
        worksheet.Column(2).Width = 30;

        worksheet.Cell("B8").Style.NumberFormat.Format = "$#,##0.00";
        worksheet.Cell("B2").Style.DateFormat.Format = "yyyy-MM-dd";
        worksheet.Cell("B11").Style.DateFormat.Format = "yyyy-MM-dd HH:mm:ss";

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
