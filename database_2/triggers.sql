--Mã món đặt trước (mamon_phieudat) phải có mã phiếu trùng với mã phiếu của order đặt bàn online 
-- CREATE TRIGGER check_mon_dat_truoc
-- ON ma_mon_phieu_dat
-- AFTER INSERT, UPDATE 
-- AS
-- BEGIN 
-- END;
-- GO

--Món ăn được đặt(mamon_phieudat) phải nằm trong danh sách thực đơn của chi nhánh(mamon_chinhanh).
CREATE TRIGGER check_ma_mon_phieu_dat
ON ma_mon_phieu_dat
AFTER INSERT, UPDATE 
AS
BEGIN 

    IF EXISTS (SELECT 1 
                FROM INSERTED new JOIN
                phieu_dat pd ON pd.MaPhieu = new.MaPhieu
                WHERE new.DatTruoc = 1 AND pd.LoaiPhieu != 2)
    BEGIN
        RAISERROR(N'Mã phiếu của món ăn đặt trước không trùng với mã phiếu của order đặt bàn online', 16, 1)
        ROLLBACK TRANSACTION;
    END

    IF(0 >= ANY (SELECT COUNT(distinct mcn.MaMon) 
				 FROM INSERTED new 
				 JOIN phieu_dat o ON new.MaPhieu = o.MaPhieu
				 JOIN chi_nhanh cn ON o.MaCN = cn.MaCN 
				 JOIN mon_an_chi_nhanh mcn ON new.MaMon = mcn.MaMon
                 GROUP BY new.MaMon, mcn.MaCN))
    BEGIN
        RAISERROR(N'Món ăn được đặt không nằm trong danh sách thực đơn của chi nhánh', 16, 1)
        ROLLBACK TRANSACTION;
    END

    IF EXISTS (SELECT 1 FROM 
                INSERTED new JOIN
                phieu_dat o ON new.MaPhieu = o.MaPhieu JOIN 
                mon_an_chi_nhanh mcn ON mcn.MaCN = o.MaCN
                WHERE mcn.MaMon = new.MaMon AND
                mcn.GiaoHang = 0 AND 
                o.LoaiPhieu = 3)
    BEGIN 
            RAISERROR(N'Món ăn đặt trong order giao hàng phải được giao bởi chi nhánh',16, 1);
        ROLLBACK TRANSACTION;
    END 
END;
GO

-- Các món ăn nằm trong đơn giao hàng phải là các món có thể giao (biến bool giaohang  = true trong bảng monan_chinhanh) 
-- CREATE TRIGGER ma_mon_phieu_dat_check_giao_hang
-- ON ma_mon_phieu_dat
-- AFTER INSERT, UPDATE 
-- AS 
-- BEGIN 
--     -- DECLARE @MaPhieu CHAR(5) 
--     -- SELECT @MaPhieu = NEW.MaPhieu
--
--
-- END;
-- GO

--  Mọi món ăn nằm trong chi nhánh phải nằm trong danh sách món của khu vực mà chi nhánh thuộc về 
CREATE TRIGGER mon_an_chi_nhanh_trigger
ON mon_an_chi_nhanh
AFTER INSERT, UPDATE 
AS
BEGIN 
    IF(0 >= ANY (SELECT COUNT(distinct mkv.MaMon) FROM INSERTED new JOIN 
                chi_nhanh cn ON new.MaCN = cn.MaCN LEFT JOIN
                mon_an_khu_vuc mkv ON mkv.MaKhuVuc = cn.MaKhuVuc AND
                                        new.MaMon = mkv.MaMon
                GROUP BY new.MaMon, new.MaCN))
    BEGIN
        RAISERROR(N'Món ăn của chi nhánh không có tại khu vực mà chi nhánh thuộc về', 16, 1)
        ROLLBACK TRANSACTION
    END
END;
GO

CREATE TRIGGER mon_an_khu_vuc_del_trigger
ON mon_an_khu_vuc
AFTER DELETE
AS
BEGIN
    DECLARE @cur CURSOR;
    DECLARE @macn INT;
    DECLARE @mamon char(5);

    SET @cur = CURSOR FOR 
    SELECT distinct macn.MaCN, macn.MaMon 
    FROM chi_nhanh cn JOIN
    DELETED del ON del.MaKhuVuc = cn.MaKhuVuc JOIN
    mon_an_chi_nhanh macn ON macn.MaCN = cn.MaCN AND
                            macn.MaMon = del.MaMon

    OPEN @cur
    FETCH NEXT FROM @cur 
    INTO @macn, @mamon
    
    WHILE @@FETCH_STATUS = 0
    BEGIN 

        DELETE FROM mon_an_chi_nhanh
        WHERE MaCN = @macn AND 
            MaMon = @mamon                   

        FETCH NEXT FROM @cur 
        INTO @macn, @mamon
    END
    CLOSE @cur;
    DEALLOCATE @cur;
END
go
--
                            
-- Nhân viên lập phiếu phải là nhân viên của chi nhánh và đang làm việc tại chi nhánh trong thời gian lập phiếu

CREATE TRIGGER order_trigger
ON phieu_dat
AFTER INSERT, UPDATE
AS 
BEGIN 

    IF 1 <= ANY(SELECT count(DISTINCT nv.MaNV) FROM 
                INSERTED new JOIN 
                chi_nhanh cn ON new.MaCN = cn.MaCN LEFT JOIN
                nhan_vien nv ON new.NhanVienLap = nv.MaNV AND
                                nv.ChiNhanh != new.MaCN
                GROUP BY new.MaCN, new.NhanVienLap)
    BEGIN
        RAISERROR(N'Nhân viên lập phiếu phải đang làm việc tại chi nhánh được tạo đơn hàng', 16, 1)
        ROLLBACK TRANSACTION
    END
END;
GO

-- Giờ đến của đặt bàn online phải nằm trong khung giờ hoạt động của chi nhánh
CREATE TRIGGER dat_ban_online_trigger 
ON dat_ban_online
AFTER INSERT, UPDATE
AS
BEGIN 
    -- SELECT new.MaPhieu, o.MaCN, COUNT(DISTINCT cn.MaCN)  
    --         FROM INSERTED new JOIN 
    --         phieu_dat o ON new.MaPhieu = o.MaPhieu JOIN
    --         chi_nhanh cn ON o.MaCN = cn.MaCN  
    --         WHERE new.GioDen < cn.GioMo OR 
    --                 new.GioDen > cn.GioDong
    --         GROUP BY new.MaPhieu, o.MaCN

    IF (1 <= ANY(SELECT COUNT(DISTINCT cn.MaCN)  
                FROM INSERTED new JOIN 
                phieu_dat o ON new.MaPhieu = o.MaPhieu JOIN
                chi_nhanh cn ON o.MaCN = cn.MaCN  
                WHERE new.GioDen < cn.GioMo OR 
                        new.GioDen > cn.GioDong
                GROUP BY new.MaPhieu, o.MaCN))
    BEGIN 
        RAISERROR(N'Giờ đến của đặt bàn online phải nằm trong giờ hoạt động của chi nhánh', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO


-- 6. loại thẻ phải được điều chỉnh dựa trên tiêu dùng tích lũy này theo các tiêu chí định trước và loại thẻ sẽ ảnh hưởng tới mức ưu đãi, giảm giá cho hóa đơn. 
	-- silver (10 triệu không tính ngày giới hạn) , ngày hôm nay - ngày cập nhật >= 1 năm -> tiêu dùng phải >= 5 triệu -> sau đó đặt tiêu dùng về 0
	-- gold ( phải có silver) trong vòng 1 năm phải 10 triệu 
CREATE TRIGGER Trg_CapNhatLoaiThe
ON the
AFTER UPDATE, INSERT
AS
BEGIN
    -- Điều kiện xuống hạng Membership nếu tiêu dùng < 50 trong 1 năm
    UPDATE the
    SET LoaiThe = 'Membership',
        NgayLap = GETDATE(),
        CapNhat = GETDATE()
    WHERE LoaiThe = 'Silver'
      AND DATEDIFF(YEAR, NgayLap, GETDATE()) > 1 -- Quá 1 năm
      AND TieuDung < 50; -- Tích lũy dưới 50

    -- Điều kiện đạt hạng Silver
    UPDATE the
    SET LoaiThe = 'Silver',
        TieuDung = 0,
        NgayLap = GETDATE(),
        CapNhat = GETDATE()
    WHERE (LoaiThe IS NULL OR LoaiThe = 'Membership') -- Thẻ chưa đạt hạng
      AND TieuDung >= 100; -- Tích lũy từ 100

    -- Giữ hạng Silver nếu tiêu dùng >= 500 trong 1 năm
    UPDATE the
    SET LoaiThe = 'Silver',
        CapNhat = GETDATE()
    WHERE LoaiThe = 'Silver'
      AND DATEDIFF(YEAR, NgayLap, GETDATE()) <= 1 -- Trong 1 năm
      AND TieuDung >= 50; -- Tích lũy từ 500

    -- Nâng hạng từ Silver lên Gold nếu tiêu dùng >= 1000 trong 1 năm
    UPDATE the
    SET LoaiThe = 'Gold',
        TieuDung = 0,
        NgayLap = GETDATE(),
        CapNhat = GETDATE()
    WHERE LoaiThe = 'Silver'
      -- AND DATEDIFF(YEAR, NgayLap, GETDATE()) <= 1 -- Trong 1 năm
      AND TieuDung >= 100; -- Tích lũy từ 1000

    -- Giữ hạng Gold nếu tiêu dùng >= 1000 trong 1 năm
    UPDATE the
    SET LoaiThe = 'Gold',
        CapNhat = GETDATE()
    WHERE LoaiThe = 'Gold'
      AND DATEDIFF(YEAR, NgayLap, GETDATE()) <= 1 -- Trong 1 năm
      AND TieuDung >= 100; -- Tích lũy từ 1000

    -- Xuống hạng từ Gold xuống Silver nếu tiêu dùng < 1000 trong 1 năm
    UPDATE the
    SET LoaiThe = 'Silver',
        NgayLap = GETDATE(),
        CapNhat = GETDATE()
    WHERE LoaiThe = 'Gold'
      AND DATEDIFF(YEAR, NgayLap, GETDATE()) > 1 -- Trong 1 năm
      AND TieuDung < 100; -- Tích lũy dưới 1000
END;
GO

-- CREATE TRIGGER check_so_dien_thoai_unique
-- ON dien_thoai_nhan_vien
-- FOR INSERT, UPDATE
-- AS
-- BEGIN
--     -- Khai báo biến để chứa số điện thoại mới thêm vào hoặc cập nhật
--     DECLARE @DienThoai NVARCHAR(11);
--     DECLARE @MaNV CHAR(5);

--     -- Lấy số điện thoại và mã nhân viên từ bảng INSERTED (chứa các bản ghi vừa được thêm hoặc cập nhật)
--     SELECT @DienThoai = DienThoai, @MaNV = MaNV
--     FROM INSERTED;

--     -- Kiểm tra xem số điện thoại này đã tồn tại trong bảng nhan_vien hay chưa
--     IF EXISTS (SELECT 1 FROM dien_thoai_nhan_vien WHERE DienThoai = @DienThoai AND MaNV <> @MaNV)
--     BEGIN
--         -- Nếu số điện thoại đã tồn tại cho nhân viên khác, hủy thao tác và thông báo lỗi
--         RAISERROR('Số điện thoại này đã được sử dụng bởi nhân viên khác!', 16, 1);
--         ROLLBACK TRANSACTION;
--     END
-- END;
-- GO

-- CREATE TRIGGER trg_CheckEndDateBeforeStartDate
-- ON lich_su_lam_viec
-- FOR INSERT, UPDATE
-- AS
-- BEGIN
--     SELECT *
--         FROM lich_su_lam_viec lsv1
--         JOIN inserted i ON lsv1.MaNV = i.MaNV
--         WHERE lsv1.MaNV = i.MaNV
--         AND lsv1.ChiNhanh <> i.ChiNhanh
--         AND lsv1.NgayKetThuc > i.NgayBatDau
--     -- Kiểm tra xem khi nhân viên chuyển chi nhánh, ngày kết thúc tại chi nhánh cũ phải trước ngày bắt đầu tại chi nhánh mới
--     IF EXISTS (
--         SELECT 1
--         FROM lich_su_lam_viec lsv1
--         JOIN inserted i ON lsv1.MaNV = i.MaNV
--         WHERE lsv1.MaNV = i.MaNV
--         AND lsv1.ChiNhanh <> i.ChiNhanh
--         AND lsv1.NgayKetThuc > i.NgayBatDau
--     )
--     BEGIN
--         -- Nếu ngày kết thúc tại chi nhánh cũ không trước ngày bắt đầu tại chi nhánh mới
--         RAISERROR ('Ngày kết thúc phải trước ngày bắt đầu trong lịch sử làm việc của nhân viên', 16, 1);
--         ROLLBACK TRANSACTION; -- Hoàn tác giao dịch
--     END
-- END
-- GO
-- Cùng 1 thời điểm thì 1 nhân viên chỉ được làm việc tại 1 chi nhánh. ( Không có khoảng thời gian chồng chéo cho cùng 1 nhân viên trong bảng Lịch sử làm việc)

CREATE TRIGGER trg_CheckOverlap_WorkTime
ON lich_su_lam_viec
FOR INSERT, UPDATE
AS
BEGIN
    -- used for debugging
    -- SELECT i.MaNV ,lsv1.ChiNhanh,lsv1.NgayBatDau, lsv1.NgayKetThuc,i.ChiNhanh, i.NgayBatDau, i.NgayKetThuc
    --     FROM lich_su_lam_viec lsv1
    --     JOIN inserted i ON lsv1.MaNV = i.MaNV
    --     WHERE (
    --         (lsv1.MaNV = i.MaNV) 
    --         AND lsv1.ChiNhanh != i.ChiNhanh
    --         AND (
    --             (i.NgayBatDau BETWEEN lsv1.NgayBatDau AND lsv1.NgayKetThuc)
    --             OR (i.NgayKetThuc BETWEEN lsv1.NgayBatDau AND lsv1.NgayKetThuc)
    --             OR (lsv1.NgayBatDau BETWEEN i.NgayBatDau AND i.NgayKetThuc)
    --             OR (lsv1.NgayKetThuc BETWEEN i.NgayBatDau AND i.NgayKetThuc)
    --         )
    --     )
   
    -- Kiểm tra không có chồng chéo thời gian làm việc cho cùng 1 nhân viên tại các chi nhánh
    IF EXISTS (
        SELECT 1
        FROM lich_su_lam_viec lsv1
        JOIN inserted i ON lsv1.MaNV = i.MaNV
        WHERE (
            (lsv1.MaNV = i.MaNV) 
            AND lsv1.ChiNhanh != i.ChiNhanh
            AND (
                (i.NgayBatDau BETWEEN lsv1.NgayBatDau AND lsv1.NgayKetThuc)
                OR (i.NgayKetThuc BETWEEN lsv1.NgayBatDau AND lsv1.NgayKetThuc)
                OR (lsv1.NgayBatDau BETWEEN i.NgayBatDau AND i.NgayKetThuc)
                OR (lsv1.NgayKetThuc BETWEEN i.NgayBatDau AND i.NgayKetThuc)
            )
        )
    )
    BEGIN
        -- Nếu có thời gian chồng chéo, đưa ra thông báo lỗi
        RAISERROR ('Ngày kết thúc và bắt đầu của 1 nhân viên tại 2 chi nhánh khác nhau không được trùng lên nhau', 16, 1);
        ROLLBACK TRANSACTION; -- Hoàn tác giao dịch
    END
END
GO

--Nhân viên quản lý phải thuộc bộ phận quản lý
CREATE TRIGGER trg_Check_Employee_Manager_Department
ON chi_nhanh
FOR INSERT, UPDATE
AS
BEGIN
    -- Kiểm tra xem nhân viên quản lý có thuộc bộ phận quản lý không
    -- DECLARE @NVQuanLy CHAR(5);
    -- DECLARE @MaBoPhan NVARCHAR(5);

    -- Lấy mã nhân viên quản lý và mã bộ phận từ bảng inserted (dành cho các thao tác INSERT và UPDATE)
    -- SELECT @NVQuanLy = new.NVQuanLy FROM inserted new;

    -- Lấy mã bộ phận của nhân viên quản lý
    -- SELECT @MaBoPhan = nv.BoPhan FROM nhan_vien nv WHERE MaNV = @NVQuanLy;

    -- SELECT 1  
    -- FROM inserted new JOIN 
    -- nhan_vien nv ON new.NVQuanLy = nv.MaNV AND 
    --                 nv.BoPhan != 5
    -- Kiểm tra nếu bộ phận của nhân viên quản lý không phải bộ phận "quản lý" (Giả sử mã bộ phận quản lý là 'BP01')
    IF EXISTS(
        SELECT 1  
        FROM inserted new JOIN 
        nhan_vien nv ON new.NVQuanLy = nv.MaNV AND 
                        nv.BoPhan != 5
    ) 
    BEGIN
        -- Nếu không thuộc bộ phận quản lý, thông báo lỗi và hoàn tác giao dịch
        RAISERROR ('Nhân viên quản lý phải thuộc về bộ phận quản lý', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO
--Nhân viên quản lý phải đang làm việc tại chi nhánh đó trong thời gian hiện tại.
CREATE TRIGGER trg_Check_Manager_Working_Current
ON chi_nhanh
FOR UPDATE
AS
BEGIN
    -- DECLARE @NVQuanLy CHAR(5);
    -- DECLARE @MaCN CHAR(5);
    -- DECLARE @NgayHienTai DATE;

    -- Lấy mã nhân viên quản lý và mã chi nhánh từ bảng inserted (dành cho các thao tác INSERT và UPDATE)
    -- SELECT @NVQuanLy = NVQuanLy, @MaCN = MaCN FROM inserted;
    
    -- Lấy ngày hiện tại
    -- SET @NgayHienTai = CONVERT(DATE, GETDATE());

    -- Kiểm tra xem nhân viên quản lý có đang làm việc tại chi nhánh đó trong ngày hiện tại không
    IF 0 < ALL(SELECT COUNT(*) FROM nhan_vien)
    BEGIN   

        -- SELECT new.MaCN, new.NVQuanLy, nv.ChiNhanh
        -- FROM inserted new JOIN
        --     nhan_vien nv ON new.NVQuanLy = nv.MaNV AND
        --                     new.MaCN != nv.ChiNhanh

        -- IF NOT EXISTS (SELECT 1 
        --                 FROM inserted new JOIN 
        --                 nhan_vien nv ON new.NVQuanLy = nv.MaNV)
        -- BEGIN
        --     RAISERROR ('Nhân viên quản lý không nằm trong danh sách nhân viên', 16, 1);
        --     ROLLBACK TRANSACTION;
        -- END


        IF EXISTS (
            SELECT 1
            FROM inserted new JOIN
                nhan_vien nv ON new.NVQuanLy = nv.MaNV AND
                                new.MaCN != nv.ChiNhanh
        )
        BEGIN
            -- Nếu nhân viên quản lý không đang làm việc tại chi nhánh trong thời gian hiện tại, đưa ra thông báo lỗi
            RAISERROR ('Nhân viên quản lý phải đang làm việc tại chi nhánh mình quản lý', 16, 1);
            ROLLBACK TRANSACTION; -- Hoàn tác giao dịch
        END
    END
END;
GO


-- CREATE TRIGGER ck_luong_nhan_vien
-- ON nhan_vien
-- AFTER INSERT, UPDATE 
-- AS
-- BEGIN
--     if EXISTS( SELECT 1 
--                 FROM INSERTED new JOIN 
--                 bo_phan bp ON new.BoPhan = bp.MaBoPhan
--                 WHERE new.Luong < bp.MucLuong * 0.95 OR 
--                         new.Luong > bp.MucLuong * 1.15)
--     BEGIN
--         RAISERROR ('Lương của nhân viên không được lớn hơn hoặc nhỏ hơn lương của bộ phận 15%',16,1);
--         ROLLBACK TRANSACTION; 
--     END
--
-- END;
-- GO
