--================================================
-- SQL Dialect: PostgreSQL
-- Ruleblock: renal_measurements
--================================================
CREATE TABLE ROUT_RENAL_MEASUREMENTS AS
WITH
  UEADV AS (
    SELECT DISTINCT eid FROM eadv
  ),
SQ_EGFR_LATEST AS (
    SELECT eid, val AS egfr_latest
    FROM (
      SELECT eid, val,
             ROW_NUMBER() OVER (PARTITION BY eid ORDER BY dt DESC) AS rn
      FROM eadv
      WHERE att = 'lab_bld_egfr'

    ) ranked
    WHERE rn = 1
  ),
SQ_EGFR_LOWEST AS (
    SELECT eid, MIN(val::numeric) AS egfr_lowest
    FROM eadv
    WHERE att = 'lab_bld_egfr'

    GROUP BY eid
  ),
SQ_RENAL_MEASUREMENTS AS (
    SELECT eid,
           CASE
           WHEN egfr_latest IS NOT NULL THEN 1
           ELSE 0
           END AS renal_measurements
    FROM UEADV
    LEFT JOIN SQ_EGFR_LATEST USING (eid)
    LEFT JOIN SQ_EGFR_LOWEST USING (eid)
  )
SELECT eid,
       egfr_latest,
       egfr_lowest,
       renal_measurements
FROM UEADV
LEFT JOIN SQ_EGFR_LATEST USING (eid)
LEFT JOIN SQ_EGFR_LOWEST USING (eid)
LEFT JOIN SQ_RENAL_MEASUREMENTS USING (eid)
-- ---
