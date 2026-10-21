<p align="center">
  <img src="./icon.svg" width="72" height="72" alt="Biểu tượng Bốc số" />
</p>

<h1 align="center">Bốc số</h1>

<p align="center">
  Công cụ web tĩnh để bốc ngẫu nhiên nhiều kết quả từ một danh sách, hiển thị rõ trên màn hình
  và lưu toàn bộ dữ liệu ngay trong trình duyệt.
</p>

**Bốc số** phù hợp cho bốc thăm món ăn, quà tặng, người tham gia, suất quay số hoặc bất kỳ danh
sách văn bản nào. Thay vì quay một vòng tròn, ứng dụng chọn ngẫu nhiên nhiều ô cùng lúc. Mặc định
là 20 ô; số ô có thể đặt từ 1 đến 100 và được lưu riêng cho từng danh sách.

Ứng dụng không cần backend, không cần build và có thể host trực tiếp bằng GitHub Pages.

| Thông số | Giá trị |
| --- | --- |
| Số kết quả mỗi lượt | 1–100 ô, mặc định 20 |
| Dữ liệu mỗi danh sách | Tối đa 20.000 mục |
| Lịch sử mỗi danh sách | 50 lượt gần nhất |
| Thời gian chạy random | 0,5–20 giây |
| Lưu trữ | `localStorage` trên trình duyệt |
| Backend / tài khoản | Không cần |

## Tính năng

### Dữ liệu và nhiều danh sách

- Dán trực tiếp nhiều dòng, CSV, dấu phẩy, dấu tab hoặc nội dung sao chép từ Excel.
- Tự nhận dạng cách tách dữ liệu, xem trước số mục và loại nội dung trùng trước khi áp dụng.
- Tạo, đổi tên, nhân bản, chuyển đổi và xóa nhiều danh sách độc lập.
- Mỗi danh sách giữ riêng dữ liệu, pool hiện tại, số ô, chính sách sau khi rút, mode random,
  thời gian chạy, lịch sử và giao diện.
- Nạp sẵn bộ [200 tên món ăn mẫu](./data/mon-an-200.txt) từ hộp **Dữ liệu nguồn**.

### Bốc ngẫu nhiên

- Bốc tối đa 100 kết quả trong một lượt.
- Không lặp kết quả trong cùng một lượt.
- Dùng `crypto.getRandomValues` để chọn chỉ số ngẫu nhiên; hiệu ứng hình ảnh không thay đổi kết quả.
- Chọn **Vẫn giữ** để mục đã trúng tiếp tục xuất hiện ở lượt sau.
- Chọn **Rút xong thì bỏ** để loại mục đã trúng khỏi pool; có thể khôi phục pool khi cần.
- Hiển thị số mục còn khả dụng và cảnh báo khi dữ liệu không đủ cho số ô đã cấu hình.

### Kiểu chạy và thời gian random

Mode và thời gian được lưu riêng theo từng danh sách:

| Kiểu chạy | Cách hiển thị |
| --- | --- |
| **Tức thì** | Hiện đủ kết quả ngay, không chờ |
| **Đồng loạt** | Các ô đổi ngẫu nhiên rồi chốt cùng lúc |
| **Cuốn chiếu** | Các ô lần lượt chốt từ trái sang phải |

Thời gian nhận giá trị từ **0,5 đến 20 giây**, theo bước 0,5 giây. Khi chọn **Tức thì**, ô thời gian
được vô hiệu hóa. Nếu người dùng bật giảm chuyển động hoặc chọn giao diện tĩnh, ứng dụng vẫn bốc
đúng kết quả nhưng bỏ hiệu ứng chờ.

### Chế độ trình chiếu

Nút **Trình chiếu** chuyển bảng kết quả sang giao diện dành cho người xem:

- Ẩn sidebar, thanh trên, bảng dữ liệu nguồn và phần lớn điều khiển quản trị.
- Mở rộng bảng kết quả theo số cột đã cấu hình hoặc chế độ tự động.
- Giữ các thao tác cần thiết: **Bốc lượt tiếp**, **Tải CSV**, **Sao chép** và **Thoát trình chiếu**.
- Nhấn `Space` để bốc lượt tiếp; nhấn `Esc` để thoát.
- Nếu trình duyệt chặn Fullscreen API, chế độ trình chiếu vẫn hoạt động trong cửa sổ hiện tại.

### Giao diện và nội dung tùy chỉnh

Có năm theme dựng sẵn:

- **Tối giản**: trung tính, phù hợp sử dụng hằng ngày.
- **Lễ hội**: vàng nổi bật và đỏ dứt khoát cho sự kiện.
- **Trang trọng**: tiết chế, màu xanh trầm, phù hợp buổi lễ.
- **Vui vẻ**: bề mặt sáng, bo góc mềm và điểm hồng.
- **Ban đêm**: nền tối, chữ sáng và điểm vàng ấm.

Mỗi danh sách có thể tùy chỉnh riêng:

- Màu nền, bề mặt, chữ và màu nhấn; ứng dụng báo tỷ lệ tương phản và cảnh báo dưới 4,5:1.
- Số cột, mật độ, độ bo góc, font hiện đại hoặc font biên tập.
- Chuyển động biểu cảm hoặc giao diện tĩnh.
- Hiển thị bảng nguồn, phần xem trước, trạng thái lưu, ghi chú cục bộ và lịch sử.
- Câu chữ của sidebar, tiêu đề, mô tả, nút, trạng thái pool, hộp dữ liệu, lịch sử, trình chiếu
  và hộp thoại.

Các câu giao diện hỗ trợ biến động như `{{count}}`, `{{remaining}}` và `{{drawCount}}`.

### Lịch sử và sao lưu

- Lưu 50 lượt gần nhất của mỗi danh sách cùng thời điểm, số mục nguồn và đầy đủ kết quả.
- Sao chép kết quả hoặc tải kết quả hiện tại thành CSV.
- Tải toàn bộ ứng dụng thành một tệp JSON để sao lưu hoặc chuyển sang trình duyệt khác.
- Nhập JSON theo kiểu gộp, không ghi đè các danh sách đang có.
- Tự chuyển dữ liệu từ các schema cũ sang schema hiện tại khi mở phiên bản mới.

## Bắt đầu sử dụng

1. Mở trang **Bốc số** và chọn danh sách cần làm việc.
2. Chọn **Dữ liệu nguồn**, dán danh sách hoặc bấm **Dùng 200 món mẫu**.
3. Chọn cách tách, bật hoặc tắt **Bỏ nội dung trùng**, kiểm tra phần xem trước rồi áp dụng.
4. Đặt số ô, chính sách **Vẫn giữ / Rút xong thì bỏ**, kiểu chạy và thời gian random.
5. Bấm **Bốc kết quả**. Dùng **Trình chiếu** khi cần cho người khác theo dõi.
6. Vào **Danh sách** để xuất JSON trước khi đổi máy, đổi trình duyệt hoặc đổi địa chỉ website.

## Định dạng dữ liệu

Mỗi dòng có thể là một mục:

```text
Phở bò tái nạm
Bún bò Huế
Cao lầu Hội An
Mì Quảng tôm thịt
```

Hoặc chọn cách tách theo dấu phẩy:

```text
Phở bò tái nạm, Bún bò Huế, Cao lầu Hội An, Mì Quảng tôm thịt
```

Nội dung danh sách được hiển thị dưới dạng văn bản thuần để tránh chèn HTML hoặc script. Có thể nạp
trực tiếp tệp mẫu tại [`data/mon-an-200.txt`](./data/mon-an-200.txt).

## Dữ liệu và quyền riêng tư

Danh sách, kết quả, lịch sử và cấu hình được lưu bằng `localStorage`. Dữ liệu không được gửi lên
backend của ứng dụng và mỗi trình duyệt có kho dữ liệu riêng.

`localStorage` được tách theo trình duyệt, profile và địa chỉ website. Dữ liệu ở `localhost` không
tự chuyển sang GitHub Pages. Trước khi đổi địa chỉ hoặc chuyển máy:

1. Mở **Danh sách**.
2. Chọn **Tải bản sao lưu**.
3. Mở ứng dụng ở địa chỉ mới.
4. Chọn **Nhập bản sao lưu** và tải tệp JSON vừa xuất.

Xóa dữ liệu trang web, dùng chế độ ẩn danh hoặc đổi tên miền có thể làm mất dữ liệu cục bộ. Tệp JSON
là phương án sao lưu và chuyển dữ liệu giữa các trình duyệt.

Ứng dụng có thể tải Google Fonts khi có mạng. Nếu nguồn font không truy cập được, giao diện dùng
font dự phòng của hệ điều hành. Nội dung danh sách và lịch sử không nằm trong yêu cầu tải font.

## Chạy trên máy

Yêu cầu Python 3:

```bash
cd lucky-board
python3 -m http.server 4173
```

Mở `http://localhost:4173`.

Nên chạy qua HTTP thay vì mở trực tiếp `index.html` bằng `file://` để chức năng tải dữ liệu mẫu hoạt
động đúng.

## Đưa lên GitHub Pages

Ứng dụng là website tĩnh hoàn chỉnh: không cần cài dependency, build hoặc cấu hình biến môi trường.

### 1. Tạo repository

Tạo một repository mới trên GitHub. Nếu repository đã có, có thể bỏ qua bước khởi tạo bên dưới.

### 2. Đưa mã nguồn lên nhánh `main`

Chạy trong thư mục `lucky-board/`:

```bash
git init -b main
git add .
git commit -m "Deploy Bốc số to GitHub Pages"
git remote add origin https://github.com/<tên-tài-khoản>/<tên-repository>.git
git push -u origin main
```

Nếu repository đã có remote, thay hai lệnh cuối bằng cách push theo cấu hình hiện có. Thư mục
`.taste-skill/` đã được `.gitignore` loại khỏi repository.

### 3. Bật GitHub Pages

1. Mở repository trên GitHub.
2. Vào **Settings → Pages**.
3. Tại **Build and deployment**, chọn **Deploy from a branch**.
4. Chọn nhánh **`main`**.
5. Chọn thư mục **`/ (root)`**.
6. Bấm **Save** và chờ GitHub Pages deploy xong.

### 4. Mở website

Đường dẫn project page có dạng:

```text
https://<tên-tài-khoản>.github.io/<tên-repository>/
```

Nếu repository có tên `<tên-tài-khoản>.github.io`, đường dẫn là:

```text
https://<tên-tài-khoản>.github.io/
```

Ứng dụng hỗ trợ chạy dưới thư mục con như GitHub project page. Mọi asset đều dùng đường dẫn tương
đối và các màn hình dùng hash nên không cần rewrite URL hoặc trang `404.html`:

- `#draw`: bảng bốc kết quả.
- `#lists`: quản lý nhiều danh sách và sao lưu.
- `#appearance`: theme, bố cục và nội dung giao diện.
- `#history`: các lượt gần nhất của danh sách hiện tại.

Tệp [`.nojekyll`](./.nojekyll) bảo GitHub Pages phục vụ nguyên trạng toàn bộ tệp tĩnh.

## Kiểm tra sau khi deploy

- Trang chủ tải được và hiển thị tiêu đề **Bốc số ngẫu nhiên**.
- Bấm **Dữ liệu nguồn → Dùng 200 món mẫu** thấy đủ 200 mục.
- Bốc thử 20 kết quả, không có mục nào trùng trong cùng lượt.
- Đổi mode và thời gian, sau đó tải lại trang vẫn thấy cấu hình đã chọn.
- Thử **Trình chiếu**, `Space` và `Esc`.
- Mở **Danh sách**, xuất JSON và kiểm tra tệp tải về.

## Xử lý sự cố

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| GitHub Pages trả về 404 | Chắc chắn `index.html` nằm ở thư mục gốc của nhánh `main`, không bị lồng thêm một thư mục |
| Trang tải nhưng không có style/script | Giữ nguyên cấu trúc `index.html`, `styles.css`, `app.js`, `icon.svg` và `data/` |
| Nút dữ liệu mẫu không chạy | Chạy qua HTTP hoặc GitHub Pages; không dùng trực tiếp `file://` |
| Dữ liệu localhost không xuất hiện | Xuất JSON tại địa chỉ cũ rồi nhập tại địa chỉ mới |
| Không đọc được clipboard | Dùng `Ctrl+V` / `Cmd+V`; API clipboard cần HTTPS hoặc `localhost` |
| Fullscreen không mở | Dùng nút **Trình chiếu** trong tab trực tiếp; giao diện focus vẫn hoạt động nếu API bị chặn |
| Font trông khác khi offline | Đây là font dự phòng; kết nối mạng để tải Google Fonts |

## Công nghệ

- HTML, CSS và JavaScript thuần, không framework.
- Không có bước build và không có dependency runtime.
- `crypto.getRandomValues` cho phép chọn ngẫu nhiên không lặp trong một lượt.
- `localStorage` cho dữ liệu local-first.
- Hash routing cho website tĩnh.
- Thiết kế responsive cho máy tính, tablet và điện thoại.

## Cấu trúc dự án

- [`index.html`](./index.html): khung giao diện, các màn hình và hộp thoại.
- [`styles.css`](./styles.css): theme, bố cục responsive, focus mode và chuyển động.
- [`app.js`](./app.js): dữ liệu, random, lịch sử, lưu cục bộ và tương tác.
- [`data/mon-an-200.txt`](./data/mon-an-200.txt): danh sách 200 món ăn mẫu.
- [`icon.svg`](./icon.svg): biểu tượng ứng dụng.
- [`.nojekyll`](./.nojekyll): cấu hình GitHub Pages phục vụ file tĩnh trực tiếp.
- [`.gitignore`](./.gitignore): loại tệp kiểm thử và tệp hệ thống khỏi repository.
