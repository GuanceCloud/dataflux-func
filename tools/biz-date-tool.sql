-- Create Date rows

SET @startDate = "2017-01-01";
SET @endDate   = "2020-12-31";

TRUNCATE TABLE tb_const_biz_date;
SET @i = -1;
SET @sql = REPEAT(" SELECT 1 UNION ALL", -DATEDIFF(@startDate, @endDate) + 1);
SET @sql = LEFT(@sql, LENGTH(@sql) - LENGTH(" UNION ALL"));
SET @sql = CONCAT("INSERT INTO tb_const_biz_date (bizDate) SELECT DATE_ADD('", @startDate, "', INTERVAL @i:= @i + 1 DAY) AS bizDate FROM (", @sql ,") AS tmp");
PREPARE stmt FROM @sql;
EXECUTE stmt;
