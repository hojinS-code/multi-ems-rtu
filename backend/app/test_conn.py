import pg8000

try:
    conn = pg8000.connect(
        host="127.0.0.1",
        port=5432,
        database="multi_ems",
        user="ems_user",
        password="password",
    )
    print("연결 성공!")
except Exception as e:
    print("타입:", type(e))
    print("str:", str(e))