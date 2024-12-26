------------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE ChuyenNhanSu
@MaNV CHAR(6),
@MaChiNhanhMoi INT,
@MaBoPhanMoi INT = NULL
AS
BEGIN
        UPDATE nhan_vien
        SET ChiNhanh = @MaChiNhanhMoi
        WHERE MaNV = @MaNV;

        IF @MaBoPhanMoi IS NOT NULL
        BEGIN
            UPDATE nhan_vien
            SET BoPhan = @MaBoPhanMoi
            WHERE MaNV = @MaNV;
        END;

		UPDATE lich_su_lam_viec
        SET NgayKetThuc = getdate()
        WHERE MaNV = @MaNV and NgayKetThuc = null;

		INSERT INTO lich_su_lam_viec (MaNV, ChiNhanh, NgayBatDau, NgayKetThuc)
        VALUES (@MaNV, @MaChiNhanhMoi, getdate(), null);

END;
GO

------------------------------------------------------------------------------


CREATE OR ALTER PROCEDURE ThemNhanVien
	@MaNV CHAR(6),
    @TenNV NVARCHAR(50),
	@SoNha NVARCHAR(50),
	@Duong NVARCHAR(50),
	@Quan NVARCHAR(50),
	@ThanhPho NVARCHAR(50),
    @NgaySinh DATE,
    @GioiTinh NVARCHAR(3),
	@MaBoPhan INT,
    @MaChiNhanh INT
AS
BEGIN
    INSERT INTO nhan_vien (MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh)
    VALUES (@MaNV, @TenNV,@SoNha, @Duong, @Quan, @ThanhPho, @NgaySinh, @GioiTinh, @MaBoPhan, @MaChiNhanh);

	INSERT INTO lich_su_lam_viec (MaNV, ChiNhanh, NgayBatDau, NgayKetThuc)
        VALUES (@MaNV, @MaChiNhanh, getdate(), null);
END;
GO

------------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE xoa_nhan_vien
    @MaNV CHAR(6) 
AS
BEGIN
    UPDATE nhan_vien
    SET DangLamViec = 0 
    WHERE MaNV = @MaNV
END
go

-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE xoa_mon_an
    @MaMon   CHAR(6)
AS
BEGIN
    DELETE FROM mon_an_khu_vuc
    WHERE MaMon = @MaMon

    DELETE FROM mon_an_chi_nhanh 
    WHERE MaMon = @MaMon
END;
go 


CREATE OR ALTER PROCEDURE xoa_mon_an_chi_nhanh
    @MaCN     INT, 
    @MaMon    CHAR(6)
AS
BEGIN
    DELETE FROM mon_an_chi_nhanh 
    WHERE MaCN = @MaCN AND
            MaMon = @MaMon
END;
go 

CREATE OR ALTER PROCEDURE xoa_mon_an_khu_vuc
    @MaMon    CHAR(6),
    @MaKV     INT  
AS
BEGIN
    DELETE FROM mon_an_khu_vuc 
    WHERE MaKhuVuc = @MaKV AND
            MaMon = @MaMon
END;
go 

-----------------------------------------------------------------------------

--CREATE OR ALTER PROCEDURE tim_mon_an_ma_mon 
--    @ma_mon CHAR(6)
--AS
--BEGIN
--    SELECT * from mon_an mm
--    WHERE mm.MaMon = @ma_mon
--END;
--go

CREATE OR ALTER PROCEDURE tim_mon_an_ten_mon
    @input_str NVARCHAR(50)
AS
BEGIN
    SELECT * from mon_an mm 
    WHERE (mm.TenMon) like N'%' + @input_str + N'%'
END;
go

-----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE them_mon_an
    @MaMon   CHAR(6),
    @TenMon  NVARCHAR(50),
    @Gia     INT,
    @Loai    NVARCHAR(50)
AS
BEGIN
    INSERT INTO mon_an (MaMon,TenMon, Gia, Loai)
    VALUES
    (@MaMon, @TenMon, @Gia, @Loai)
END;
go 


CREATE OR ALTER PROCEDURE them_mon_an_chi_nhanh
    @MaCN     INT, 
    @MaMon    CHAR(6),
    @GiaoHang BIT
AS
BEGIN
    INSERT INTO mon_an_chi_nhanh (MaCN, MaMon, GiaoHang)
    VALUES
    (@MaCN, @MaMon, @GiaoHang)
END;
go 

CREATE OR ALTER PROCEDURE them_mon_an_khu_vuc
    @MaMon    CHAR(6),
    @MaKV     INT  
AS
BEGIN
    INSERT INTO mon_an_khu_vuc (MaMon, MaKhuVuc)
    VALUES
    (@MaMon, @MaKV)
END;
go 


-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE them_ma_mon_phieu_dat
    @MaPhieu CHAR(6),
    @MaMon   CHAR(6),
    @SoLuong INT,
    @DatTruoc BIT
AS 
BEGIN
    IF EXISTS(
    SELECT 1 FROM
    ma_mon_phieu_dat mmpd
    WHERE mmpd.MaPhieu = @MaPhieu AND
            mmpd.MaMon = @MaMon
    ) 
    BEGIN
        UPDATE ma_mon_phieu_dat
        SET SoLuong = SoLuong + @SoLuong
        WHERE MaPhieu = @MaPhieu AND
                MaMon = @MaMon
    END;
    ELSE 
    BEGIN
        INSERT INTO ma_mon_phieu_dat
        (MaPhieu, MaMon, SoLuong, DatTruoc)
        VALUES 
        (@MaPhieu, @MaMon, @SoLuong, @DatTruoc)
    END
END;
go
-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE them_dat_ban_online
    @MaPhieu      CHAR(6),
    @NgayDat      DATE,
    @MaCN         INT,
    @NhanVienLap  CHAR(6),
    @CCCD         CHAR(12),
    @KhuVuc       INT,
    @SoLuongKhach INT,
    @GioDen       TIME,
    @GhiChu       NVARCHAR(100)
AS 
BEGIN
    INSERT INTO phieu_dat (MaPhieu, NgayDat, MaCN, NhanVienLap, CCCD, LoaiPhieu)
    VALUES
    (@MaPhieu, @NgayDat, @MaCN, @NhanVienLap, @CCCD, 2)

    INSERT INTO dat_ban_online (MaPhieu, KhuVuc, SoLuongKhach, GioDen, GhiChu)
    VALUES
    (@MaPhieu, @KhuVuc, @SoLuongKhach, @GioDen, @GhiChu)
END
go

-----------------------------------------------------------------------------
-- use this function carefully
CREATE OR ALTER PROCEDURE calc_all_hoa_don
AS
BEGIN
    DECLARE @cur CURSOR;
    DECLARE @IMaPhieu CHAR(6);
    

    SET @cur = CURSOR FOR
    SELECT DISTINCT pd.MaPhieu
    FROM phieu_dat pd

    OPEN @cur

    FETCH NEXT FROM @cur INTO @IMaPhieu

    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC calc_hoa_don @MaPhieu = @IMaPhieu
        FETCH NEXT FROM @cur INTO @IMaPhieu
    END
    CLOSE @cur
    DEALLOCATE @cur
END
go

-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE alter_nhan_vien 
    @MaNV        CHAR(6),
    @HoTen       NVARCHAR(50),
    @SoNha       NVARCHAR(50),
    @Duong       NVARCHAR(50),
    @Quan        NVARCHAR(50),
    @ThanhPho    NVARCHAR(50),
    @NgaySinh    DATE, 
    @Phai        NVARCHAR(3),
    @BoPhan      INT ,
    @ChiNhanh    INT ,
    @Luong       INT ,  
    @DangLamViec BIT
AS
BEGIN
    UPDATE nhan_vien
    SET
    HoTen       = @HoTen      ,
    SoNha       = @SoNha      ,
    Duong       = @Duong      ,
    Quan        = @Quan       ,
    ThanhPho    = @ThanhPho   ,
    NgaySinh    = @NgaySinh   ,
    Phai        = @Phai       ,
    BoPhan      = @BoPhan     ,
    ChiNhanh    = @ChiNhanh   ,
    Luong       = @Luong      ,
    DangLamViec = @DangLamViec
    WHERE
    MaNV        = @MaNV
END
go


-----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE alter_mon_an
    @MaMon   CHAR(6),
    @TenMon  NVARCHAR(50),
    @Gia     INT,
    @Loai    NVARCHAR(50)
AS
BEGIN
    UPDATE mon_an 
    SET TenMon = @TenMon, 
        Gia = @Gia, 
        Loai = @Loai
    WHERE MaMon = @MaMon
END;
go 


CREATE OR ALTER PROCEDURE alter_mon_an_chi_nhanh
    @MaCN     INT, 
    @MaMon    CHAR(6),
    @GiaoHang BIT
AS
BEGIN
    UPDATE mon_an_chi_nhanh 
    SET MaMon = @MaMon,
        GiaoHang = @GiaoHang
    WHERE MaCN = @MaCN
END;
go 

CREATE OR ALTER PROCEDURE alter_mon_an_khu_vuc
    @MaMon    CHAR(6),
    @MaKV     INT  
AS
BEGIN
    UPDATE mon_an_khu_vuc 
    SET MaMon = @MaMon
    WHERE MaKhuVuc = @MaKV
END;
go 


-----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN
    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT pd.MaCN AS MaChiNhanh,
        pd.NgayDat AS Ngay, 
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE pd.MaCN = @MaCN AND pd.NgayDat >= @Ngay1 AND pd.NgayDat <= @Ngay2
    GROUP BY pd.MaCN, pd.NgayDat
END;
GO

GO
CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh_thang
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN

    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT 
        pd.MaCN AS MaChiNhanh,
        CONCAT(MONTH(pd.NgayDat),'/', YEAR(pd.NgayDat)) AS Thang,
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE 
        pd.MaCN = @MaCN AND
        DATEDIFF(MONTH, pd.NgayDat, @Ngay1) <= 0 AND 
        DATEDIFF(MONTH, pd.NgayDat, @Ngay2) >= 0
    GROUP BY MONTH(pd.NgayDat), YEAR(pd.NgayDat), pd.MaCN;  
END;
GO

CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh_quy
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN
    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT 
        pd.MaCN AS MaChiNhanh,
        CONCAT('Q',DATEPART(QUARTER, pd.NgayDat),' ', YEAR(pd.NgayDat)) AS Quy,
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE 
        pd.MaCN = @MaCN AND
        DATEDIFF(YEAR, pd.NgayDat, @Ngay1) <= 0 AND 
        DATEDIFF(YEAR, pd.NgayDat, @Ngay2) >= 0
    GROUP BY 
        DATEPART(QUARTER, pd.NgayDat),
        YEAR(pd.NgayDat),
        pd.MaCN;
END;
GO

CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh_nam
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN

    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT 
        pd.MaCN AS MaChiNhanh,
        YEAR(pd.NgayDat) AS Nam,
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE 
        pd.MaCN = @MaCN AND
        DATEDIFF(YEAR, pd.NgayDat, @Ngay1) <= 0 AND 
        DATEDIFF(YEAR, pd.NgayDat, @Ngay2) >= 0
    GROUP BY YEAR(pd.NgayDat), pd.MaCN;  
END;
GO


-----------------------------------------------------------------------------
-- viết truy vấn xem danh sách nhân viên theo 1 chi nhánh
go
CREATE OR ALTER PROCEDURE DanhSachNhanVienTheoChiNhanh
    @MaCN INT
AS
BEGIN
    SELECT * FROM nhan_vien WHERE ChiNhanh = @MaCN
END

-- Viết truy vấn xem danh sách nhân viên tất cả chi nhánh
go
CREATE OR ALTER PROCEDURE DanhSachNhanVienCuaTatCaChiNhanh
AS
BEGIN
    SELECT * FROM nhan_vien
END

--Viết truy vấn xem danh sách nhân viên theo chi nhánh với danh sách 
-- chi nhánh được truyền theo dạng chuỗi với số lượng chưa biết trước
go
CREATE OR ALTER PROCEDURE DanhSachNhanVienTheoChiNhanhChuoi
    @MaCN NVARCHAR(100)
AS
BEGIN
    WITH DSChiNhanh AS
    (
        SELECT value as MaChiNhanh FROM STRING_SPLIT(@MaCN, ',')
    )
    SELECT * FROM nhan_vien WHERE ChiNhanh IN (SELECT MaChiNhanh FROM DSChiNhanh)
END
-----------------------------------------------------------------------------
go
CREATE OR ALTER PROCEDURE XoaPhieuDat
    @MaPhieu CHAR(6) 
AS
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM phieu_dat WHERE MaPhieu = @MaPhieu)
        BEGIN
            PRINT 'Phieu dat khong ton tai. Khong the xoa.';
            RETURN;
        END

		DELETE FROM giao_hang WHERE MaPhieu = @MaPhieu; 
        DELETE FROM tham_gia_chuong_trinh WHERE MaPhieu = @MaPhieu;
        DELETE FROM ma_mon_phieu_dat WHERE MaPhieu = @MaPhieu;
        DELETE FROM danh_gia WHERE MaPhieu = @MaPhieu;
        DELETE FROM hoa_don WHERE MaPhieu = @MaPhieu;

        DELETE FROM phieu_dat WHERE MaPhieu = @MaPhieu;

        PRINT 'Phieu dat da duoc xoa thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE TimKiemHoaDonTheoNgay
    @StartDate DATE,     
    @EndDate DATE          
AS
BEGIN
    BEGIN TRY
        SELECT 
            hd.MaPhieu AS MaHoaDon,
            hd.TongTien,
            hd.GiamGia,
            hd.ThanhTien,
            hd.DiemTichLuy,
            pd.NgayDat,
            pd.MaCN AS MaChiNhanh,
            pd.LoaiPhieu,
            pd.CCCD AS MaKhachHang
        FROM 
            hoa_don hd
        INNER JOIN 
            phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
        WHERE 
            pd.NgayDat BETWEEN @StartDate AND @EndDate
        ORDER BY 
            pd.NgayDat DESC;

        PRINT 'Tim kiem hoa don theo ngay thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE TimKiemHoaDonTheoMaKhachHang
    @CCCD CHAR(12)
AS
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM khach_hang WHERE CCCD = @CCCD)
        BEGIN
            PRINT 'Khach hang khong ton tai. Khong the tim hoa don.';
            RETURN;
        END

        SELECT 
            hd.MaPhieu AS MaHoaDon,
            hd.TongTien,
            hd.GiamGia,
            hd.ThanhTien,
            hd.DiemTichLuy,
            pd.NgayDat,
            pd.MaCN AS MaChiNhanh,
            pd.LoaiPhieu
        FROM 
            hoa_don hd
        INNER JOIN 
            phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
        WHERE 
            pd.CCCD = @CCCD
        ORDER BY 
            pd.NgayDat DESC;

        PRINT 'Tim kiem hoa don thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO
-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE ThongKeDoanhThuMonAnTheoKhuVuc
AS
BEGIN
    SELECT 
        kv.MaKhuVuc AS MaKhuVuc,
        kv.TenKhuVuc AS TenKhuVuc,
        ma.MaMon AS MaMon,
        ma.TenMon AS TenMon,
        SUM(mmpd.SoLuong) AS SoLuongBanRa,
        SUM(mmpd.SoLuong * ma.Gia) AS TongDoanhThu
    FROM 
        khu_vuc kv
    JOIN 
        chi_nhanh cn ON kv.MaKhuVuc = cn.MaKhuVuc
    JOIN 
        phieu_dat pd ON cn.MaCN = pd.MaCN
    JOIN 
        ma_mon_phieu_dat mmpd ON pd.MaPhieu = mmpd.MaPhieu
    JOIN 
        mon_an ma ON mmpd.MaMon = ma.MaMon
    GROUP BY 
        kv.MaKhuVuc, kv.TenKhuVuc, ma.MaMon, ma.TenMon
    ORDER BY 
        kv.MaKhuVuc, ma.MaMon;
END;
GO

----------------------------------------------------------------------------- 

CREATE OR ALTER PROCEDURE ThemTheKhachHang
    @MaThe CHAR(6),          
    @CCCD CHAR(12),             
    @NgayLap DATETIME,          
    @LoaiThe VARCHAR(10),       
    @TieuDung FLOAT(24) = 0,    
    @NhanVienLap CHAR(6) = NULL,
    @CapNhat DATETIME = NULL   
AS
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM khach_hang WHERE CCCD = @CCCD)
        BEGIN
            PRINT 'Khách hàng không tồn tại. Không thể thêm thẻ.';
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM the WHERE MaThe = @MaThe)
        BEGIN
            PRINT 'Ma the da ton tai. Vui long su dung ma the khac.';
            RETURN;
        END

        INSERT INTO the (MaThe, CCCD, NgayLap, LoaiThe, TieuDung, NhanVienLap, CapNhat)
        VALUES (
            @MaThe,               
            @CCCD,                
            @NgayLap,             
            @LoaiThe,             
            @TieuDung,            
            @NhanVienLap,        
            ISNULL(@CapNhat, GETDATE()) 
        );

        PRINT 'The khach hang da duoc them thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

--------------------------------------------------------------------------------------------------
--Xóa thẻ khách hàng
CREATE OR ALTER PROCEDURE XoaTheKhachHang
    @MaThe CHAR(6) 
AS
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM the WHERE MaThe = @MaThe)
        BEGIN
            PRINT 'The khong ton tai. Khong the xoa the.';
            RETURN;
        END

        DELETE FROM the
        WHERE MaThe = @MaThe;

        PRINT 'The khach hang da duoc xoa thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

--------------------------------------------------------------------------------------------------
--Cập nhật thẻ khách hàng
CREATE OR ALTER PROCEDURE CapNhatTheKhachHang
    @MaThe CHAR(6),            
    @CCCD CHAR(12) = NULL,     
    @LoaiThe VARCHAR(10) = NULL, 
    @TieuDung FLOAT(24) = NULL,
    @NhanVienLap CHAR(6) = NULL, 
    @CapNhat DATETIME = NULL    
AS
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM the WHERE MaThe = @MaThe)
        BEGIN
            PRINT 'The khong ton tai. Khong the cap nhat.';
            RETURN;
        END

        -- Kiểm tra xem khách hàng có tồn tại nếu cập nhật CCCD
        IF @CCCD IS NOT NULL AND NOT EXISTS (SELECT 1 FROM khach_hang WHERE CCCD = @CCCD)
        BEGIN
            PRINT 'Khach hang khong ton tai. Khong the cap nhat CCCD.';
            RETURN;
        END

        -- Cập nhật thông tin thẻ
        UPDATE the
        SET 
            CCCD = ISNULL(@CCCD, CCCD),              
            LoaiThe = ISNULL(@LoaiThe, LoaiThe),     
            TieuDung = ISNULL(@TieuDung, TieuDung), 
            NhanVienLap = ISNULL(@NhanVienLap, NhanVienLap), 
            CapNhat = ISNULL(@CapNhat, GETDATE())   
        WHERE 
            MaThe = @MaThe;

        PRINT 'Thong tin the khach hang da duoc cap nhat thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

--------------------------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE CapNhatPhieuDat
    @MaPhieu CHAR(6),          
    @NgayDat DATE = NULL,     
    @MaCN INT = NULL,           
    @NhanVienLap CHAR(6) = NULL, 
    @CCCD CHAR(12) = NULL,       
    @LoaiPhieu INT = NULL        
AS
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM phieu_dat WHERE MaPhieu = @MaPhieu)
        BEGIN
            PRINT 'Phieu dat khong ton tai. Khong the cap nhat.';
            RETURN;
        END

        IF @MaCN IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chi_nhanh WHERE MaCN = @MaCN)
        BEGIN
            PRINT 'Chi nhanh khong ton tai. Khong the cap nhat MaCN.';
            RETURN;
        END

        IF @NhanVienLap IS NOT NULL AND NOT EXISTS (SELECT 1 FROM nhan_vien WHERE MaNV = @NhanVienLap)
        BEGIN
            PRINT 'Nhan vien lap khong ton tai. Khong the cap nhat.';
            RETURN;
        END

        IF @CCCD IS NOT NULL AND NOT EXISTS (SELECT 1 FROM khach_hang WHERE CCCD = @CCCD)
        BEGIN
            PRINT 'Khach hang khong ton tai. Khong the cap nhat.';
            RETURN;
        END

        UPDATE phieu_dat
        SET 
            NgayDat = ISNULL(@NgayDat, NgayDat),        
            MaCN = ISNULL(@MaCN, MaCN),                
            NhanVienLap = ISNULL(@NhanVienLap, NhanVienLap), 
            CCCD = ISNULL(@CCCD, CCCD),                
            LoaiPhieu = ISNULL(@LoaiPhieu, LoaiPhieu) 
        WHERE 
            MaPhieu = @MaPhieu;

        PRINT 'Thong tin phieu dat da duoc cap nhat thanh cong.';
    END TRY
    BEGIN CATCH
        PRINT 'Da xay ra loi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

--------------------------------------------------------------------------------------------------
go
CREATE OR ALTER PROCEDURE getDiemPhucVuByDay 
	@Ngay date
as
begin
	-- có thể select ra ít cột lại
	select distinct nv.MaNV, nv.HoTen, nv.NgaySinh, nv.Phai, nv.BoPhan, nv.ChiNhanh, nv.Luong, dg.DiemPhucVu, pd.NgayDat
	from danh_gia dg join phieu_dat pd
	on dg.MaPhieu = pd.MaPhieu join nhan_vien nv
	on nv.MaNV = pd.NhanVienLap
	where pd.NgayDat = @Ngay;
end;

-- test
-- exec getDiemPhucVuByDay @Ngay = '2024-01-10'


-- điểm phụ vụ của nhân viên theo tháng
go
CREATE OR ALTER PROCEDURE getDiemPhucVuByMonth
	@thang int, @nam int
as
begin 
	select distinct nv.MaNV, nv.HoTen, nv.NgaySinh, nv.Phai, nv.BoPhan, nv.ChiNhanh, nv.Luong, dg.DiemPhucVu, pd.NgayDat
	from danh_gia dg join phieu_dat pd 
	on dg.MaPhieu = pd.MaPhieu join nhan_vien nv
	on nv.MaNV = pd.NhanVienLap
	where @nam = YEAR(pd.NgayDat) and @thang = MONTH(pd.NgayDat)
end;

-- test
-- exec getDiemPhucVuByMonth @thang = 5, @nam = 2024;


-- điểm phục vụ của nhân viên theo quý
go
CREATE OR ALTER PROCEDURE getDiemPhucVuByQuarter
	@quarter int, @nam int
as
begin
	select distinct nv.MaNV, nv.HoTen, nv.NgaySinh, nv.Phai, nv.BoPhan, nv.ChiNhanh, nv.Luong, dg.DiemPhucVu, pd.NgayDat, @quarter as 'Quarter'
	from danh_gia dg join phieu_dat pd
	on dg.MaPhieu = pd.MaPhieu join nhan_vien nv
	on nv.MaNV = pd.NhanVienLap
	where @nam = YEAR(pd.NgayDat) and (
	(@quarter = 1 and MONTH(pd.NgayDat) between 1 and 3) or
	(@quarter = 2 and MONTH(pd.NgayDat) between 4 and 7) or
	(@quarter = 3 and MONTH(pd.NgayDat) between 8 and 9) or
	(@quarter = 4 and MONTH(pd.NgayDat) between 10 and 12)
	);
end;

-- test
--exec getDiemPhucVuByQuarter @quarter = 2, @nam = 2024;



-- điểm phục vụ của nhân viên theo năm
go
CREATE OR ALTER PROCEDURE getDiemPhucVuByYear
	@nam int
as
begin
	select distinct nv.MaNV, nv.HoTen, nv.NgaySinh, nv.Phai, nv.BoPhan, nv.ChiNhanh, nv.Luong, dg.DiemPhucVu, pd.NgayDat
	from danh_gia dg join phieu_dat pd
	on dg.MaPhieu = pd.MaPhieu join nhan_vien nv
	on nv.MaNV = pd.NhanVienLap
	where @nam = YEAR(pd.NgayDat)
end;

-- test
--exec getDiemPhucVuByYear @nam = 2024

--------------------------------------------------------------------------------------------------
go
CREATE OR ALTER PROCEDURE sp_GetEmployeeByBranch 
	@MaChiNhanh int
as 
begin
	select nv.MaNV, nv.HoTen, nv.SoNha, nv.Duong, nv.Quan, nv.ThanhPho, nv.NgaySinh, nv.Phai, nv.BoPhan, nv.ChiNhanh, nv.Luong
	from nhan_vien nv join chi_nhanh cn 
	on nv.ChiNhanh = cn.MaCN
	where cn.MaCN = @MaChiNhanh
end;


--------------------------------------------------------------------------------------------------
go
create or alter procedure proc_updateLuongNhanVien
	@MaNV char(6), @luongMoi int
as
begin
	declare @luongHienTai int, @maBP int;
	
	-- lấy lương hiện tại và mã bộ phận
	select @luongHienTai = nv.Luong, @maBP = nv.BoPhan
	from nhan_vien nv
	where nv.MaNV = @MaNV;

	-- nếu lương mới khác lương hiện tại --> update
	if @luongMoi != @luongHienTai
		begin 
			update nhan_vien 
			set Luong = @luongMoi
			where MaNV = @MaNV
		end

end


--------------------------------------------------------------------------------------------------

go
CREATE OR ALTER PROCEDURE searchNhanVien
	@maNV char(6) = null, @hoten nvarchar(50) = null
as
begin
	select *
	from nhan_vien nv join bo_phan bp 
	on nv.BoPhan = bp.MaBoPhan 
	where ( @maNV is null or nv.MaNV like '%' + @maNV + '%' ) and (nv.HoTen like '%' + @hoten + '%' or @hoten is null)
	order by nv.ChiNhanh ASC
end;
--------------------------------------------------------------------------------------------------
go
CREATE OR ALTER PROCEDURE sp_themPhieuDat 
	@MaPhieu     CHAR(6),
    @NgayDat     DATE,
    @MaCN        INT,
    @NhanVienLap CHAR(6),
    @CCCD        CHAR(12),
    @LoaiPhieu   INT
as
begin 
	begin transaction		
		begin try
			insert into phieu_dat(MaPhieu, NgayDat, MaCN, NhanVienLap, CCCD, LoaiPhieu)
			values (@MaPhieu, @NgayDat, @MaCN, @NhanVienLap, @CCCD, @LoaiPhieu)
			commit;
		end try

		begin catch
			-- rollback
			rollback;
			print('Có lỗi xãy ra khi thêm phiếu đặt: ' + error_message());
		end catch
end;

--------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------Món ăn----------------------------------------------------------


-- thêm món ăn trang admin/menu
go
CREATE OR ALTER PROCEDURE them_mon_an
    @MaMon   CHAR(6),
    @TenMon  NVARCHAR(50),
    @Gia     INT,
    @Loai    NVARCHAR(50)
AS
BEGIN
    INSERT INTO mon_an (MaMon,TenMon, Gia, Loai)
    VALUES
    (@MaMon, @TenMon, @Gia, @Loai)
END;


-- search mon an (theo mã món)
go
CREATE OR ALTER PROCEDURE tim_mon_an_ma_mon 
    @ma_mon CHAR(6)
AS
BEGIN
    SELECT * from mon_an mm
    WHERE mm.MaMon = @ma_mon
END;
go
-- search mon an (theo tên món)
CREATE OR ALTER PROCEDURE tim_mon_an_ten_mon
    @input_str NVARCHAR(50)
AS
BEGIN
    SELECT * from mon_an mm 
    WHERE (mm.TenMon) like N'%' + @input_str + N'%'
END;

-- xoá món ăn KHU VỰC + CHI NHÁNH
go
CREATE OR ALTER PROCEDURE xoa_mon_an
    @MaMon   CHAR(6)
AS
BEGIN
    DELETE FROM mon_an_khu_vuc
    WHERE MaMon = @MaMon

    DELETE FROM mon_an_chi_nhanh 
    WHERE MaMon = @MaMon
END;
go 

--exec xoa_mon_an @MaMon = 'MM001'


-- xoá món ăn chi nhánh
go
CREATE OR ALTER PROCEDURE xoa_mon_an_chi_nhanh
    @MaCN     INT, 
    @MaMon    CHAR(6)
AS
BEGIN
    DELETE FROM mon_an_chi_nhanh 
    WHERE MaCN = @MaCN AND
            MaMon = @MaMon
END;
go 


-- xoá món ăn khu vực
CREATE OR ALTER PROCEDURE xoa_mon_an_khu_vuc
    @MaMon    CHAR(6),
    @MaKV     INT  
AS
BEGIN
    DELETE FROM mon_an_khu_vuc 
    WHERE MaKhuVuc = @MaKV AND
            MaMon = @MaMon
END;
go 



-------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------thẻ-------------------------------------------


-- thêm thẻ mới:
CREATE OR ALTER PROCEDURE TaoTheMoi
	@MaThe CHAR(6),
    @CCCD CHAR(12),       
    @LoaiThe VARCHAR(10),  
    @NhanVienLap CHAR(6)  
AS
BEGIN
    -- Kiểm tra xem CCCD có tồn tại trong bảng khach_hang không
    IF NOT EXISTS (SELECT 1 FROM khach_hang WHERE CCCD = @CCCD)
    BEGIN
        PRINT 'Khách hàng không tồn tại';
        RETURN;
    END

    -- Kiểm tra xem mã nhân viên có tồn tại trong bảng nhan_vien không (nếu có nhân viên)
    IF @NhanVienLap IS NOT NULL AND NOT EXISTS (SELECT 1 FROM nhan_vien WHERE MaNV = @NhanVienLap)
    BEGIN
        PRINT 'Mã nhân viên không hợp lệ';
        RETURN;
    END

    -- Thêm thông tin vào bảng the
    INSERT INTO the (MaThe, CCCD, NgayLap, LoaiThe, NhanVienLap, CapNhat)
    VALUES (@MaThe, @CCCD, GETDATE(), @LoaiThe, @NhanVienLap, GETDATE());
    
    SELECT @MaThe AS MaTheMoi;
END






-------------------------------------DUY BẮC THỐNG KÊ------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------
go
CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN
    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT pd.MaCN AS MaChiNhanh,
        pd.NgayDat AS Ngay, 
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE pd.MaCN = @MaCN AND pd.NgayDat >= @Ngay1 AND pd.NgayDat <= @Ngay2
    GROUP BY pd.MaCN, pd.NgayDat
END;
GO

-- EXEC xem_doanh_thu_chi_nhanh @MaCN = 1, @Ngay1 = '02/15/2024', @Ngay2 = '04/12/2024'

-- SELECT * FROM hoa_don;

GO
CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh_thang
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN

    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT 
        pd.MaCN AS MaChiNhanh,
        CONCAT(MONTH(pd.NgayDat),'/', YEAR(pd.NgayDat)) AS Thang,
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE 
        pd.MaCN = @MaCN AND
        DATEDIFF(MONTH, pd.NgayDat, @Ngay1) <= 0 AND 
        DATEDIFF(MONTH, pd.NgayDat, @Ngay2) >= 0
    GROUP BY MONTH(pd.NgayDat), YEAR(pd.NgayDat), pd.MaCN;  
END;
GO

-- EXEC xem_doanh_thu_chi_nhanh @MaCN = 1, @Ngay1 = '02/15/2024', @Ngay2 = '04/12/2024'
-- EXEC xem_doanh_thu_chi_nhanh_thang @MaCN = 1, @Ngay1 = '02/15/2024', @Ngay2 = '04/12/2024'

GO
CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh_quy
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN
    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT 
        pd.MaCN AS MaChiNhanh,
        CONCAT('Q',DATEPART(QUARTER, pd.NgayDat),' ', YEAR(pd.NgayDat)) AS Quy,
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE 
        pd.MaCN = @MaCN AND
        DATEDIFF(YEAR, pd.NgayDat, @Ngay1) <= 0 AND 
        DATEDIFF(YEAR, pd.NgayDat, @Ngay2) >= 0
    GROUP BY 
        DATEPART(QUARTER, pd.NgayDat),
        YEAR(pd.NgayDat),
        pd.MaCN;
END;
GO

-- EXEC xem_doanh_thu_chi_nhanh_quy @MaCN = 1, @Ngay1 = '02/15/2024', @Ngay2 = '04/12/2024'

CREATE OR ALTER PROCEDURE xem_doanh_thu_chi_nhanh_nam
    @MaCN INT,      -- Mã chi nhánh
    @Ngay1 DATE,      -- Ngày cần xem doanh thu
    @Ngay2 DATE      -- Ngày cần xem doanh thu
AS
BEGIN

    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT 
        pd.MaCN AS MaChiNhanh,
        YEAR(pd.NgayDat) AS Nam,
        SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    WHERE 
        pd.MaCN = @MaCN AND
        DATEDIFF(YEAR, pd.NgayDat, @Ngay1) <= 0 AND 
        DATEDIFF(YEAR, pd.NgayDat, @Ngay2) >= 0
    GROUP BY YEAR(pd.NgayDat), pd.MaCN;  
END;
GO

--Test
--exec xem_doanh_thu_chi_nhanh_nam 1, 2024

--------------------------------------------------------------------------------------------------

-- Viết truy vấn xem doanh thu theo ngày của nhiều chi nhánh
GO
CREATE OR ALTER PROCEDURE xem_doanh_thu_nhieu_chi_nhanh_ngay
    @MaCN NVARCHAR(100), -- Danh sách mã chi nhánh, phân tách bằng dấu phẩy
    @Ngay DATE           -- Ngày cần xem doanh thu
AS
BEGIN
    -- Tách danh sách mã chi nhánh thành các giá trị riêng lẻ
    WITH DSChiNhanh AS
    (
        SELECT value AS MaChiNhanh FROM STRING_SPLIT(@MaCN, ',')
    )
    SELECT MaChiNhanh INTO #TempChiNhanh FROM DSChiNhanh;

    -- Tính tổng doanh thu
    SELECT pd.MaCN, SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    JOIN #TempChiNhanh cn ON pd.MaCN = cn.MaChiNhanh
    WHERE pd.NgayDat = @Ngay
    GROUP BY pd.MaCN;

    -- Xóa bảng tạm
    DROP TABLE #TempChiNhanh;
END;
GO
--Test
--exec xem_doanh_thu_nhieu_chi_nhanh_ngay '1,2', '2024-04-18'

--------------------------------------------------------------------------------------------------

-- Viết truy vấn xem doanh thu theo tháng của nhiều chi nhánh
GO
CREATE OR ALTER PROCEDURE xem_doanh_thu_nhieu_chi_nhanh_thang
    @MaCN NVARCHAR(100), -- Danh sách mã chi nhánh, phân tách bằng dấu phẩy
    @Thang INT,          -- Tháng cần xem doanh thu
    @Nam INT             -- Năm cần xem doanh thu
AS
BEGIN
    -- Tách danh sách mã chi nhánh thành các giá trị riêng lẻ và chuyển sang kiểu INT
    WITH DSChiNhanh AS
    (
        SELECT CAST(value AS INT) AS MaChiNhanh
        FROM STRING_SPLIT(@MaCN, ',')
    )
    -- Lưu kết quả từ CTE vào bảng tạm
    SELECT MaChiNhanh INTO #TempChiNhanh FROM DSChiNhanh;

    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT pd.MaCN, SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    JOIN #TempChiNhanh cn ON pd.MaCN = cn.MaChiNhanh
    WHERE MONTH(pd.NgayDat) = @Thang AND YEAR(pd.NgayDat) = @Nam
    GROUP BY pd.MaCN;

    -- Xóa bảng tạm sau khi sử dụng
    DROP TABLE #TempChiNhanh;
END;
GO
--Test
--exec xem_doanh_thu_nhieu_chi_nhanh_thang '1,5', 3, 2024

--------------------------------------------------------------------------------------------------

-- Viết truy vấn xem doanh thu theo quý của nhiều chi nhánh
go
CREATE OR ALTER PROCEDURE xem_doanh_thu_nhieu_chi_nhanh_quy
    @MaCN NVARCHAR(100), -- Danh sách mã chi nhánh, phân tách bằng dấu phẩy
    @Quy INT,            -- Số quý
    @Nam INT             -- Năm
AS
BEGIN
    -- Tách danh sách mã chi nhánh thành các giá trị riêng lẻ và lưu vào bảng tạm
    WITH DSChiNhanh AS
    (
        SELECT CAST(value AS INT) AS MaChiNhanh
        FROM STRING_SPLIT(@MaCN, ',')
    )
    SELECT MaChiNhanh INTO #TempChiNhanh FROM DSChiNhanh; -- Lưu kết quả vào bảng tạm


    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT pd.MaCN, SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    JOIN #TempChiNhanh cn ON pd.MaCN = cn.MaChiNhanh
    WHERE DATEPART(QUARTER, pd.NgayDat) = @Quy AND YEAR(pd.NgayDat) = @Nam
    GROUP BY pd.MaCN;

    -- Dọn dẹp bảng tạm
    DROP TABLE #TempChiNhanh;
END;
GO
--Test
--exec xem_doanh_thu_nhieu_chi_nhanh_quy '2,6', 2, 2024

--------------------------------------------------------------------------------------------------

-- Viết truy vấn xem doanh thu theo năm của nhiều chi nhánh
GO
CREATE OR ALTER PROCEDURE xem_doanh_thu_nhieu_chi_nhanh_nam
    @MaCN NVARCHAR(100), -- Danh sách mã chi nhánh, phân tách bằng dấu phẩy
    @Nam INT             -- Năm cần xem doanh thu
AS
BEGIN
    -- Tách danh sách mã chi nhánh thành các giá trị riêng lẻ và lưu vào bảng tạm
    WITH DSChiNhanh AS
    (
        SELECT CAST(value AS INT) AS MaChiNhanh
        FROM STRING_SPLIT(@MaCN, ',')
    )
    SELECT MaChiNhanh INTO #TempChiNhanh FROM DSChiNhanh; -- Lưu kết quả vào bảng tạm

    -- Tính tổng doanh thu sau khi cập nhật bảng hoa_don
    SELECT pd.MaCN, SUM(hd.ThanhTien) AS DoanhThu
    FROM hoa_don hd
    JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
    JOIN #TempChiNhanh cn ON pd.MaCN = cn.MaChiNhanh
    WHERE YEAR(pd.NgayDat) = @Nam
    GROUP BY pd.MaCN;

    -- Dọn dẹp bảng tạm
    DROP TABLE #TempChiNhanh;
END;
GO
--Test
--exec xem_doanh_thu_nhieu_chi_nhanh_nam '1,2,3', 2024


delete from khu_vuc
where khu_vuc.MaKhuVuc = 6
