-- Các món ?n n?m trong ??n giao hàng ph?i là các món có th? giao (bi?n bool giaohang  = true trong b?ng monan_chinhanh) 
CREATE TRIGGER ma_mon_phieu_dat_check_giao_hang
ON ma_mon_phieu_dat
AFTER INSERT, UPDATE 
AS 
BEGIN 
    DECLARE @MaPhieu CHAR(5) 
    -- SELECT @MaPhieu = NEW.MaPhieu

    IF EXISTS (SELECT 1 FROM 
                INSERTED new JOIN
                "order" o ON new.MaPhieu = o.MaPhieu JOIN 
                mon_an_chi_nhanh mcn ON mcn.MaCN = o.MaCN
                WHERE mcn.MaMon = new.MaMon AND
                mcn.GiaoHang = 0 AND 
                o.LoaiPhieu = 3)
    BEGIN 
            RAISERROR(N'Món ?n ??t trong order giao hàng ph?i ???c giao b?i chi nhánh',16, 1);
        ROLLBACK TRANSACTION;
    END 
    
END;
GO

--  M?i món ?n n?m trong chi nhánh ph?i n?m trong danh sách món c?a khu v?c mà chi nhánh thu?c v? 
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
        RAISERROR(N'Món ?n c?a chi nhánh không có t?i khu v?c mà chi nhánh thu?c v?', 16, 1)
        ROLLBACK TRANSACTION
    END
END;
GO

-- Nhân viên l?p phi?u ph?i là nhân viên c?a chi nhánh và ?ang làm vi?c t?i chi nhánh trong th?i gian l?p phi?u

CREATE TRIGGER order_trigger
ON "order"
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
        RAISERROR(N'Nhân viên l?p phi?u ph?i ?ang làm vi?c t?i chi nhánh ???c t?o ??n hàng', 16, 1)
        ROLLBACK TRANSACTION
    END
END;
GO

-- Gi? ??n c?a ??t bàn online ph?i n?m trong khung gi? ho?t ??ng c?a chi nhánh
CREATE TRIGGER dat_ban_online_trigger 
ON dat_ban_online
AFTER INSERT, UPDATE
AS
BEGIN 
    -- SELECT new.MaPhieu, o.MaCN, COUNT(DISTINCT cn.MaCN)  
    --         FROM INSERTED new JOIN 
    --         "order" o ON new.MaPhieu = o.MaPhieu JOIN
    --         chi_nhanh cn ON o.MaCN = cn.MaCN  
    --         WHERE new.GioDen < cn.GioMo OR 
    --                 new.GioDen > cn.GioDong
    --         GROUP BY new.MaPhieu, o.MaCN

    IF (1 <= ANY(SELECT COUNT(DISTINCT cn.MaCN)  
                FROM INSERTED new JOIN 
                "order" o ON new.MaPhieu = o.MaPhieu JOIN
                chi_nhanh cn ON o.MaCN = cn.MaCN  
                WHERE new.GioDen < cn.GioMo OR 
                        new.GioDen > cn.GioDong
                GROUP BY new.MaPhieu, o.MaCN))
    BEGIN 
        RAISERROR(N'Gi? ??n c?a ??t bàn online ph?i n?m trong gi? ho?t ??ng c?a chi nhánh', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO