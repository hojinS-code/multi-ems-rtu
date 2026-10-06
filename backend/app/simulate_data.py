"""
테스트용 실시간 데이터 삽입 도구

사용법 (backend/app 폴더에서 실행):
    conda activate multi_ems
    cd C:\\Users\\soluwins\\Desktop\\dev-study\\multi-ems-rtu\\backend\\app
    python simulate_data.py

- 장비 ID와 수집 주기(초)를 입력하면, 그 주기마다 측정값을 DB에 삽입합니다.
- 서버 폴링(polling_service)과 같은 테이블/같은 시간대(KST)로 저장합니다.
- 종료는 Ctrl+C 입니다.

주의: 실제 계측기가 연결되어 값이 쌓이는 장비에 넣으면 실제 값과 섞입니다.
"""
import random
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from db.session import engine
from model.device import Device
from model.measurement import SinglePhaseMeasurement, ThreePhaseMeasurement
from model.environment_measurement import EnvironmentMeasurement

try:
    from services.alarm_service import check_alarms
except Exception:  # 알람 서비스를 불러오지 못해도 삽입 자체는 동작하게 한다
    check_alarms = None

KST = timezone(timedelta(hours=9))

TYPE_LABELS = {
    "single_phase": "단상",
    "three_phase": "3상",
    "environment": "온습도조도계",
}


def clamp(value, low, high):
    return max(low, min(high, value))


def ask_int(prompt, default=None, minimum=1):
    while True:
        raw = input(prompt).strip()
        if not raw and default is not None:
            return default
        try:
            value = int(raw)
        except ValueError:
            print("숫자로 입력해주세요.")
            continue
        if value < minimum:
            print(f"{minimum} 이상으로 입력해주세요.")
            continue
        return value


def ask_yes_no(prompt, default=False):
    raw = input(prompt).strip().lower()
    if not raw:
        return default
    return raw in ("y", "yes", "ㅛ")


def device_label(device):
    label = TYPE_LABELS.get(device.device_type, device.device_type)
    if device.wiring:
        label += f" {device.wiring}"
    return f"ID {device.id} | {device.name} | {label} | slave_id={device.slave_id}"


# ---------------------------------------------------------------- 값 생성

def init_state(db, device):
    if device.device_type == "single_phase":
        last = (
            db.query(SinglePhaseMeasurement.total_energy)
            .filter(SinglePhaseMeasurement.device_id == device.id)
            .order_by(SinglePhaseMeasurement.timestamp.desc())
            .first()
        )
        energy = float(last[0]) if last and last[0] is not None else 0.0
        return {"voltage": 220.0, "current": 3.0, "energy": energy}

    if device.device_type == "three_phase":
        return {
            "voltage": [220.0, 220.0, 220.0],
            "current": [10.0, 10.0, 10.0],
        }

    return {"temperature": 23.0, "humidity": 50.0, "illuminance": 300.0}


def build_single(device_id, now, state, interval):
    state["voltage"] = clamp(state["voltage"] + random.uniform(-0.6, 0.6), 214.0, 226.0)
    state["current"] = clamp(state["current"] + random.uniform(-0.3, 0.3), 0.5, 8.0)

    power_factor = round(random.uniform(0.92, 0.99), 3)
    apparent = state["voltage"] * state["current"]
    active_power = round(apparent * power_factor)
    reactive_power = round(apparent * (1 - power_factor ** 2) ** 0.5)
    state["energy"] += active_power * interval / 3600 / 1000  # kWh

    record = SinglePhaseMeasurement(
        device_id=device_id,
        timestamp=now,
        voltage=round(state["voltage"], 1),
        current=round(state["current"], 2),
        power_factor=power_factor,
        active_power=active_power,
        reactive_power=reactive_power,
        total_energy=round(state["energy"], 2),
    )
    summary = (
        f"V={record.voltage}V  I={record.current}A  "
        f"유효={record.active_power}  누적={record.total_energy}kWh"
    )
    return record, summary


def build_three(device_id, now, state, interval):
    for i in range(3):
        state["voltage"][i] = clamp(state["voltage"][i] + random.uniform(-0.6, 0.6), 214.0, 226.0)
        state["current"][i] = clamp(state["current"][i] + random.uniform(-0.5, 0.5), 1.0, 20.0)

    power_factor = round(random.uniform(0.90, 0.98), 3)
    apparent = sum(v * a for v, a in zip(state["voltage"], state["current"]))
    active_power = round(apparent * power_factor, 1)
    reactive_power = round(apparent * (1 - power_factor ** 2) ** 0.5, 1)

    v1, v2, v3 = (round(v, 1) for v in state["voltage"])
    a1, a2, a3 = (round(a, 2) for a in state["current"])

    record = ThreePhaseMeasurement(
        device_id=device_id,
        timestamp=now,
        voltage_l1=v1,
        voltage_l2=v2,
        voltage_l3=v3,
        current_l1=a1,
        current_l2=a2,
        current_l3=a3,
        power_factor=power_factor,
        active_power=active_power,
        reactive_power=reactive_power,
    )
    summary = f"V={v1}/{v2}/{v3}V  I={a1}/{a2}/{a3}A  유효={active_power}"
    return record, summary


def build_environment(device_id, now, state, interval):
    state["temperature"] = clamp(state["temperature"] + random.uniform(-0.2, 0.2), 18.0, 30.0)
    state["humidity"] = clamp(state["humidity"] + random.uniform(-0.8, 0.8), 30.0, 70.0)
    state["illuminance"] = clamp(state["illuminance"] + random.uniform(-15, 15), 50.0, 800.0)

    record = EnvironmentMeasurement(
        device_id=device_id,
        timestamp=now,
        temperature=round(state["temperature"], 1),
        humidity=round(state["humidity"], 1),
        illuminance=round(state["illuminance"]),
    )
    summary = f"온도={record.temperature}  습도={record.humidity}  조도={record.illuminance}"
    return record, summary


BUILDERS = {
    "single_phase": build_single,
    "three_phase": build_three,
    "environment": build_environment,
}


# ---------------------------------------------------------------- 메인

def main():
    print("=== 테스트용 실시간 데이터 삽입 ===")

    with Session(engine) as db:
        devices = db.query(Device).order_by(Device.id).all()
        if not devices:
            print("등록된 장비가 없습니다. 먼저 장비를 등록해주세요.")
            return

        print("\n등록된 장비:")
        for d in devices:
            print("  " + device_label(d))

        by_id = {d.id: d for d in devices}
        while True:
            device_id = ask_int("\n데이터를 넣을 장비 ID: ")
            if device_id in by_id:
                break
            print("목록에 없는 ID입니다.")
        device = by_id[device_id]

        builder = BUILDERS.get(device.device_type)
        if builder is None:
            print(f"지원하지 않는 장비 종류입니다: {device.device_type}")
            return

        interval = ask_int("수집 주기(초, 그냥 Enter면 60): ", default=60)

        use_alarm = False
        if check_alarms is not None and device.device_type != "environment":
            use_alarm = ask_yes_no("알람 판정도 함께 실행할까요? (y/N): ")

        print(f"\n[주의] 실제 계측기가 연결된 장비라면 실제 값과 섞입니다.")
        if not ask_yes_no(f"ID {device.id} 장비에 {interval}초마다 데이터를 넣을까요? (y/N): "):
            print("취소했습니다.")
            return

        state = init_state(db, device)
        print("\n삽입을 시작합니다. 종료하려면 Ctrl+C 를 누르세요.\n")

        count = 0
        next_tick = time.monotonic()
        try:
            while True:
                now = datetime.now(KST).replace(tzinfo=None)
                record, summary = builder(device.id, now, state, interval)

                try:
                    db.add(record)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"[{now:%H:%M:%S}] 저장 실패: {e}")
                else:
                    count += 1
                    print(f"[{now:%H:%M:%S}] #{count} 저장  {summary}")
                    if use_alarm:
                        try:
                            check_alarms(db, device.id, record)
                        except Exception as e:
                            db.rollback()
                            print(f"    알람 판정 중 오류: {e}")

                next_tick += interval
                delay = next_tick - time.monotonic()
                if delay > 0:
                    time.sleep(delay)
                else:
                    next_tick = time.monotonic()
        except KeyboardInterrupt:
            print(f"\n중지했습니다. 총 {count}건을 저장했습니다.")


if __name__ == "__main__":
    main()
