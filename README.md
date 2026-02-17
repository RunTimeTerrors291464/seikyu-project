1. When create the migration.
$env:MIGRATION_NAME="CreateUserTable"; npm run migration:generate:platform

Việc dùng chung Stock Adjustment (Phiếu điều chỉnh) để "chữa cháy" cho mọi trường hợp sai sót hoặc trả hàng là một "cạm bẫy" mà rất nhiều hệ thống mới xây dựng mắc phải. Nếu làm vậy, sau này khi xuất báo cáo, kế toán sẽ không thể phân biệt được đâu là hàng bị mất cắp (hao hụt thực tế), đâu là hàng khách trả lại, và đâu là hàng xuất trả nhà cung cấp.

Để hệ thống (nhất là các project liên quan đến hóa đơn/thanh toán) rõ ràng, minh bạch và dễ dàng mở rộng, bạn nên chia các loại chứng từ kho thành 3 nhóm chính với ít nhất 6 loại phiếu (Document Types) cơ bản sau:

Nhóm 1: Luồng Nhập vào (Inbound / Tăng tồn kho)
PURCHASE_RECEIPT (Phiếu nhập kho mua hàng)

Bản chất: Đây chính là Import Invoice cũ của bạn.

Mục đích: Ghi nhận hàng mua mới từ Nhà cung cấp (Vendor) nhập vào kho.

Tác động: Tăng tồn kho, tăng công nợ phải trả.

SALES_RETURN_RECEIPT (Phiếu nhập hàng bán bị trả lại)

Bản chất: Thay vì dùng phiếu điều chỉnh, đây là chứng từ chuyên dụng khi khách hàng trả lại hàng.

Mục đích: Ghi nhận hàng từ khách (Customer) quay về kho.

Liên kết: Bắt buộc phải có trường reference_invoice_id trỏ về cái Selling Invoice gốc để biết khách đang trả lại từ đơn hàng nào.

Tác động: Tăng tồn kho (nhưng thường nhập vào một kho riêng như "Kho hàng lỗi/Kho chờ xử lý" thay vì kho bán mới).

Nhóm 2: Luồng Xuất ra (Outbound / Giảm tồn kho)
SALES_DELIVERY (Phiếu xuất kho bán hàng / Selling Invoice)

Bản chất: Đây chính là Selling Invoice hiện tại của bạn.

Mục đích: Xuất hàng giao cho khách.

Tác động: Giảm tồn kho, tăng doanh thu / công nợ phải thu.

PURCHASE_RETURN (Phiếu xuất trả Nhà cung cấp)

Bản chất: Luồng ngược lại của phiếu nhập mua. Khi bạn nhập hàng vào, phát hiện hàng lỗi, bạn gom lại xuất trả cho Vendor.

Mục đích: Đưa hàng ra khỏi kho để trả lại nơi sản xuất.

Liên kết: Trỏ về PURCHASE_RECEIPT (Phiếu nhập gốc).

Tác động: Giảm tồn kho, giảm công nợ phải trả cho nhà cung cấp.

Nhóm 3: Luồng Nội bộ (Internal / Điều chỉnh)
INVENTORY_ADJUSTMENT (Phiếu điều chỉnh tồn kho / Phiếu kiểm kê)

Bản chất: Đây là cái Stock Adjustment của bạn, nhưng giờ đây chức năng của nó bị thu hẹp lại cho đúng chuẩn.

Mục đích: Chỉ dùng cho các trường hợp: Kiểm kê định kỳ phát hiện dư/thiếu hàng, hàng bị hỏng hóc trong kho phải vứt bỏ, hoặc hao hụt tự nhiên. Không dùng nó để "chữa" lỗi của luồng Mua/Bán.

Tác động: Có thể Tăng hoặc Giảm tồn kho tùy theo số lượng kiểm kê thực tế so với hệ thống. Bắt buộc phải đi kèm cột Reason (Lý do: Mất mát, Hư hỏng, Hết hạn sử dụng...).