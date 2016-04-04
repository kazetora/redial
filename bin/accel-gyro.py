import sys
import json
sys.path.append('/eaglet/lib')
sys.path.append('/eaglet/module')
from MPU9250 import MPU9250
#from pprint import pprint

mpu9250 = MPU9250()

accel = mpu9250.getAcceleromter()
gyro  = mpu9250.getGyro()

out = {'accel': accel, 'gyro': gyro}

print json.dumps(out);
