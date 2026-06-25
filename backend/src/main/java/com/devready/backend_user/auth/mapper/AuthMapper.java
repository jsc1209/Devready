package com.devready.backend_user.auth.mapper;
import com.devready.backend_user.auth.vo.MemberVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
@Mapper
public interface AuthMapper {
    int countByEmail(@Param("email") String email);
    int insertMember(MemberVO member);
    MemberVO findByEmail(@Param("email") String email);
}
