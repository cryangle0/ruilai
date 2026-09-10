package com.ruilai.module.product.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruilai.module.product.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ProductMapper extends BaseMapper<Product> {

    @Select("SELECT id, code, name, type, status FROM product WHERE id = #{key} OR code = #{key} ORDER BY deleted ASC LIMIT 1")
    Product findDisplayByKey(@Param("key") String key);
}
