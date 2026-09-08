package com.ruilai.module.sn;

import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class SnWriter {

    private final SnCodeMapper snMapper;

    /**
     * {@code updateById} skips nulls, so agency fields that must become empty
     * are cleared with an explicit SQL SET NULL afterwards.
     */
    public void update(SnCode row) {
        if (row == null || !StringUtils.hasText(row.getSn())) {
            return;
        }
        snMapper.updateById(row);
        if (row.getL2Id() == null) {
            snMapper.clearL2Id(row.getSn());
        }
        if (row.getL1Id() == null) {
            snMapper.clearL1Id(row.getSn());
        }
    }

    /** status 已回一级/原厂仓，但 l2Id 仍挂着，会把库存算进二级。 */
    public static boolean leftoverL2(SnCode row) {
        if (row == null || !StringUtils.hasText(row.getL2Id())) {
            return false;
        }
        String status = row.getStatus();
        return "l1".equals(status) || "warehouse".equals(status);
    }
}
