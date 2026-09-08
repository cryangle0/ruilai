package com.ruilai.module.sn.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruilai.module.sn.entity.SnCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SnCodeMapper extends BaseMapper<SnCode> {

    @Update("UPDATE sn_code SET l2_id = NULL WHERE sn = #{sn} AND deleted = 0")
    int clearL2Id(@Param("sn") String sn);

    @Update("UPDATE sn_code SET l1_id = NULL WHERE sn = #{sn} AND deleted = 0")
    int clearL1Id(@Param("sn") String sn);
}
