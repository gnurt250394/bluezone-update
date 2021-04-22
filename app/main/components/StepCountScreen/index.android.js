import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,

} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { isIPhoneX } from '../../../core/utils/isIPhoneX';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

import moment from 'moment';
import 'moment/locale/vi'; // without this line it didn't work
import Header from '../../../base/components/Header';
import message from '../../../core/msg/stepCount';
import { injectIntl, intlShape } from 'react-intl';
import * as fontSize from '../../../core/fontSize';
import * as scheduler from '../../../core/notifyScheduler';
import {
  getResultSteps,
  setResultSteps,
  getAutoChange,
  getIsShowNotification,
  getNotiStep,
  setConfirmAlert,
  getConfirmAlert,
  getFirstTimeSetup,
  setFirstTimeSetup,
  getIsOnOfApp
} from '../../../core/storage';
import ChartLineV from './ChartLineV';
import {
  ResultSteps,
} from '../../../const/storage';

import {
  getDistances,
  getStepsTotal,
  getStepsTotalPromise,
  getDistancesWithData
} from '../../../core/calculation_steps';

import BackgroundJob from './../../../core/service_stepcounter'
import {
  addStepCounter,
  getListHistory,
  addHistory,
  removeAllStepDay,
  getListStepDayBefore,
  getListStartDateHistory,
  getListStepsBefore,
} from './../../../core/db/RealmDb'

import ButtonIconText from '../../../base/components/ButtonIconText';
import { red_bluezone } from '../../../core/color';
import { FS, RFValue } from '../../../const/multiscreen';

import { CalculationStepTargetAndroid } from '../../../core/calculation_step_target';
import ModalChangeTarget from './Components/ModalChangeTarget';

const options = {
  taskName: 'Bluezone',
  taskTitle: 'Bluezone - Tiện ích sức khoẻ',
  taskDesc: 'Bluezone đếm bước chân',
  taskIcon: {
    name: 'icon_bluezone',
    type: 'mipmap',
  },
  linkingURI: 'mic.bluezone://bluezone/HomeStack/stepCount',
  parameters: {
    delay: 1000,
  },
  targetStep: 10000,
  currentStep: 0,
  isShowStep: true,
  valueTarget: 1021
};

const StepCount = ({ props, intl, navigation }) => {

  useEffect(() => {
    observerStepDrawUI();
    // scheduler.createWarnningWeightNotification()
    synchronizeDatabaseStepsHistory()
    return () => {
      BackgroundJob.removeTargetChange();
      BackgroundJob.removeObserverHistoryChange();
    }
  }, [])

  const observerStepDrawUI = async () => {
    getResultBindingUI();
    BackgroundJob.observerStepSaveChange(() => {
      getResultBindingUI()
    })
    BackgroundJob.observerHistorySaveChange(async () => {
      getListHistoryChart();
      getResultBindingUI();
    })
    BackgroundJob.observerTargetChange(async () => {
      await resultSteps()
    })
  }

  const getListHistoryChart = async () => {
    try {
      let curentTime = moment().unix()
      let start = curentTime - 86400 * 8
      let end = curentTime - 86400
      let steps = await getListHistory(start, end)
      if (steps.length > 7) {
        steps.splice(0, 1)
      }
      let list = steps.map(item => {
        let tmp = JSON.parse(item?.resultStep || {})
        return {
          x: moment.unix(item?.starttime).format('DD/MM'),
          y: tmp?.step || 0,
        }
      });
      let listTime = []
      list.forEach(e => {
        listTime.push(e?.x)
      });
      setDataChart(list)
      setTime(listTime)

      await alert7dayLessThan1000(steps)
    } catch (err) {
      console.log('getListHistoryChart error', err)
    }
  }

  const alert7dayLessThan1000 = async (steps) => {
    if (steps.length >= 7) {
      let check = true
      steps.forEach(element => {
        let tmp = JSON.parse(element?.resultStep)
        if ((tmp?.step || 0) >= 1000) {
          check = false
        }
      });
      if (check) {
        await showNotificationAlert7DayLessThan100()
      }
    }
  }

  const getResultBindingUI = async () => {
    let result = await getDistances();
    let time = result?.time || 0;
    let h = parseInt(time / 3600)
    let m = parseInt((time % 3600) / 60)
    setDistant(result?.distance || 0);
    setCountCarlo(result?.calories || 0);
    setCountTime(m);
    setCountTimeHour(h)
    setCountStep(result?.step || 0);
  }

  const taskStepCounter = async () => {
    await new Promise(async () => {
      // scheduleLastDay()
      // schedule7PM();
      let isFirst = await getFirstTimeSetup()
      if (isFirst == undefined) {
        await setFirstTimeSetup()
      }

      loopTimeToSchedule()

      getStepsTotal(async total => {
        let targetSteps = await getResultSteps();
        let isShowStep = await getIsShowNotification()
        BackgroundJob.updateNotification({
          ...options,
          currentStep: total || 0,
          targetStep: targetSteps?.step || 10000,
          isShowStep: isShowStep
        })
      })

      BackgroundJob.observerStep(async steps => {
        let targetSteps = await getResultSteps();
        let isShowStep = await getIsShowNotification()


        if (steps.stepCounter) {
          try {
            await addStepCounter(steps?.startTime,
              steps?.endTime,
              steps?.stepCounter)
            BackgroundJob.sendEmitSaveSuccess()
          } catch (er) {
          }
        }

        getStepsTotal(total => {
          BackgroundJob.updateNotification({
            ...options,
            currentStep: total || 0,
            targetStep: parseInt(targetSteps?.step || 10000),
            isShowStep: isShowStep,
            valueTarget: 123
          })
        })
      })

      BackgroundJob.observerHistorySaveChange(async () => {
        await autoChangeStepsTarget()
      })
    })
  }

  const synchronizeDatabaseStepsHistory = async () => {
    try {
      let listStepBefore = await getListStepsBefore();
      if (listStepBefore?.length == 0) {
        await saveHistoryEmpty()
        return
      }
      const group = listStepBefore.reduce((acc, current) => {
        const time = moment.unix(parseInt(current.starttime / 1000)).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).unix()
        if (!acc[time]) {
          acc[time] = [];
        }
        acc[time].push(current);
        return acc;
      }, {})

      for (const [key, value] of Object.entries(group)) {
        let timeMoment = moment.unix(key)
        let startTime = timeMoment.startOf('day').unix()
        let endTime = timeMoment.endOf('day').unix()

        // Nếu ngày đó trong lịch sử chưa có, sẽ lưu lại giá trị
        let result = await getDistancesWithData(value);
        if (Object.keys(result).length <= 0) {
          return;
        }
        await addHistory(startTime, result)

        await removeAllStepDay(startTime * 1000, endTime * 1000)
      }

      await saveHistoryEmpty()
    } catch (error) {
      console.log('ERROR synchronizeDatabaseStepsHistory', error)
    }
  }

  const saveHistoryEmpty = async () => {
    try {
      let currentTime = moment().startOf('day').unix()
      // Lọc ra tất cả thời gian trên db
      let listDayStart = await getListStartDateHistory(currentTime)
      listDayStart = listDayStart.map(t => t.starttime)
      let lastTime = await getFirstTimeSetup()
      if (!lastTime) {
        lastTime = { time: currentTime }
      }
      if (listDayStart.length == 0 && (currentTime - lastTime?.time == 86400)) {
        listDayStart.push(lastTime?.time - 86400)
        listDayStart.push(currentTime)
      } else {
        if (!listDayStart.some(t => t == currentTime)) {
          listDayStart.push(currentTime)
        }
      }

      if (listDayStart.length <= 1) {
        BackgroundJob.sendEmitSaveHistorySuccess()
        return
      }
      // Nếu ngày nào chưa có trong db sẽ tự động thêm, nhưng dữ liệu sẽ mặc định là 0 0 0 0
      let tmp = []
      listDayStart.forEach((item, index) => {
        if (index > 0) {
          let kAbstract = item - listDayStart[index - 1]
          if (kAbstract > 86400) {
            let x = parseInt(kAbstract / 86400) - 1
            let listFor = Array.from(Array(x).keys())
            listFor.forEach(e => {
              tmp.push(item - (e + 1) * 86400)
            })
          }
        }
      });

      await Promise.all(tmp.map(async element => {
        await addHistory(element, {
          step: 0,
          distance: 0.00,
          calories: 0,
          time: 0,
        }).then(re => console.log('RESSSSS', re)).catch(err => console.log('DENEWRRORR', err))
      }))
      BackgroundJob.sendEmitSaveHistorySuccess()
    } catch (error) {
      console.log('saveHistoryEmpty error', error)
    }
  }

  const loopTimeToSchedule = async (oldId) => {
    if (oldId) {
      BackgroundJob.clearTimeout(oldId);
    }
    await switchTimeToSchedule();
    let currentTime = new moment()
    let today7pm = new moment().set({ hour: 19, minute: 0, second: 0, millisecond: 0 })
    let tomorow = new moment(currentTime).add(1, 'days')
    tomorow.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })

    let timeDiff = tomorow.diff(currentTime, 'milliseconds')
    let timeDiff7h = 10001
    if (today7pm.isAfter(currentTime)) {
      timeDiff7h = today7pm.diff(currentTime, 'milliseconds')
    }
    let tmpTime = Math.min(timeDiff, timeDiff7h)
    if (tmpTime > 10000) {
      tmpTime = 10000
    }
    const timeoutId = BackgroundJob.setTimeout(() => {
      loopTimeToSchedule(timeoutId);
    }, tmpTime)
  }

  const switchTimeToSchedule = async () => {
    let currentTime = new moment()
    let tmpStart1 = new moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    let tmpEnd1 = new moment().set({ hour: 0, minute: 0, second: 9, millisecond: 59 })
    let tmpStart2 = new moment().set({ hour: 19, minute: 0, second: 0, millisecond: 0 })
    let tmpEnd2 = new moment().set({ hour: 19, minute: 0, second: 9, millisecond: 59 })
    if (currentTime.isAfter(tmpStart1) && currentTime.isBefore(tmpEnd1)) {
      await scheduleLastDay()
    } else if (currentTime.isAfter(tmpStart2) && currentTime.isBefore(tmpEnd2)) {
      await schedule7PM()
    }
  }

  const schedule7PM = async () => {
    await pushNotificationWarning()
  }

  const scheduleLastDay = async () => {
    await saveHistory();
  }

  const pushNotificationWarning = async () => {
    let checkOnOff = await getIsOnOfApp()
    if (checkOnOff == undefined) {
      checkOnOff = true
    }

    let tmpStep = await getNotiStep()
    if (tmpStep == undefined) {
      tmpStep = true
    }
    if (checkOnOff == true && tmpStep == true) {
      let totalStep = await getStepsTotalPromise();
      scheduler.createWarnningStepNotification(totalStep || 0)
    }
  }

  const autoChangeStepsTarget = async () => {
    try {
      let stepTarget = await getResultSteps()
      let currentTime = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      if (stepTarget != undefined) {
        let tmp = `${stepTarget?.date}`
        if (tmp.length >= 13) {
          tmp = tmp.slice(0, 10)
        }
        let v = parseInt(tmp)
        let lastUpdateTarget = moment.unix(v).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })

        if (currentTime.unix() <= v ||
          (currentTime.format('DD/MM/YYYY') == lastUpdateTarget.format('DD/MM/YYYY'))) {
          return
        }
      }

      let lastTime = await getFirstTimeSetup()
      let firstTime = new moment.unix(lastTime?.time)
      let tmpDay = new moment().diff(firstTime, 'days')

      if (tmpDay < 2) {
        return
      }

      let auto = await getAutoChange();

      if ((auto != undefined && auto?.value == false) ||
        (auto?.value == true && auto?.time == currentTime.unix())
      ) {
        return
      }

      currentTime = currentTime.toDate().getTime()
      let startDay = new moment().subtract(4, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      let listHistory = await getListHistory(startDay.unix(), new moment().unix())
      if (listHistory?.length <= 0) return

      let listData = listHistory.map(element => {
        let resultTmp = JSON.parse(element?.resultStep)
        return (resultTmp?.step || 0)
      })
      let stepTargetNew = CalculationStepTargetAndroid(listData, stepTarget?.step || 10000, tmpDay)
      let resultSave = {
        step: stepTargetNew,
        date: currentTime
      }
      await setResultSteps(resultSave)
    } catch (err) {
      console.log('setResultSteps error', err)
    }
    try {
      BackgroundJob.sendEmitSaveTargetSuccess()
      BackgroundJob.updateTypeNotification()
    } catch (_) { }
  }

  const saveHistory = async () => {
    try {
      let tmp = new moment().subtract(1, 'days')
      let yesterdayStart = tmp.clone().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).unix()
      let yesterdayEnd = tmp.clone().set({ hour: 23, minute: 59, second: 59, millisecond: 59 }).unix()

      let listStepYesterday = await getListStepDayBefore()
      let result = await getDistancesWithData(listStepYesterday);
      if (Object.keys(result).length <= 0) {
        return;
      }

      try {
        await addHistory(yesterdayStart, result)
      } catch (err) {
        console.log('addHistory ERROR', err)
      }

      try {
        await removeAllStepDay(yesterdayStart * 1000, yesterdayEnd * 1000)
      } catch (err) {
        console.log('removeAllStepDay ERROR', err)
      }

      BackgroundJob.sendEmitSaveHistorySuccess()
      BackgroundJob.updateTypeNotification()
    } catch (error) {
      console.log('saveHistory error', error)
    }
  }

  const { formatMessage, locale } = intl;

  const [time, setTime] = useState([]);
  const [countStep, setCountStep] = useState(null);
  const [countRest, setCountRest] = useState(0);
  const [countCarlo, setCountCarlo] = useState(0);
  const [countTime, setCountTime] = useState(0);
  const [countTimeHour, setCountTimeHour] = useState(0);
  const [distant, setDistant] = useState(0);
  const [totalCount, setTotalCount] = useState(10000);
  const [dataChart, setDataChart] = useState([]);

  const [isShowModalAlert, setIsShowModalAlert] = useState(false)

  const openModalAlert7Day = () => setIsShowModalAlert(true)

  const closeModalAlert7Day = () => setIsShowModalAlert(false)

  useFocusEffect(
    React.useCallback(() => {
      startOrOffApp();
      resultSteps();
      getListHistoryChart();
    }, [])
  );

  const startOrOffApp = async () => {
    try {
      let checkOnOff = await getIsOnOfApp()
      if (checkOnOff == undefined) {
        checkOnOff = true
      }
      let isRun = BackgroundJob.isRunning();
      if (!isRun && checkOnOff) {
        BackgroundJob.start(taskStepCounter, options);
      } else if (isRun && !checkOnOff) {
        BackgroundJob.stop()
      }
    } catch (err) {
      console.log('startOrOffApp error', err)
    }
  }

  const resultSteps = async () => {
    try {
      let resultSteps = await getResultSteps(ResultSteps);
      let currentTime = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate().getTime()
      if (!resultSteps) {
        setResultSteps({ step: totalCount, date: currentTime });
      } else {
        setTotalCount(resultSteps.step);
      }
    } catch (error) { }
  };

  const numberWithCommas = x => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const onShowMenu = () => {
    navigation.openDrawer();
  };

  const showNotificationAlert7DayLessThan100 = async () => {
    let old = await getConfirmAlert()
    let oldTime = moment(old, 'DD/MM/YYYY')
    if (!old || (oldTime && moment().diff(oldTime, 'days') >= 7)) {
      openModalAlert7Day()
    }
  }

  const confirmStepsTarget = async (type) => {
    await setConfirmAlert(new moment().format('DD/MM/YYYY'))
    let currentTime = new moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    if (type == 1) {
      let targetSteps = await getResultSteps();
      let resultSave = {
        step: targetSteps?.step,
        date: currentTime.toDate().getTime()
      }
      await setResultSteps(resultSave)
      closeModalAlert7Day()
    } else {
      let resultSave = {
        step: 10000,
        date: currentTime.toDate().getTime()
      }
      await setFirstTimeSetup()
      await setResultSteps(resultSave)
      await resultSteps()
      closeModalAlert7Day()
    }
  }

  const renderChart = useMemo(() => {
    if (dataChart?.length > 0 && time?.length > 0) {
      return (
        <View>
          <ChartLineV
            totalCount={totalCount}
            data={dataChart}
            time={time}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('stepHistory', {
                dataHealth: {
                  countStep, countRest: (totalCount - countStep) > 0 ? (totalCount - countStep) : 0
                  , countCarlo, distant
                },
              })
            }
            style={{
              zIndex: 10000,
              position: 'absolute',
              width: '100%',
              height: '100%'
            }}>
          </TouchableOpacity>
        </View>
      )
    }
  }, [dataChart, time, totalCount])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />

      <Header
        // onBack={onBack}
        colorIcon={red_bluezone}
        title={formatMessage(message.title)}
        styleHeader={styles.header}
        styleTitle={{
          color: '#000',
          fontSize: fontSize.fontSize17,
        }}
        showMenu={true}
        onShowMenu={onShowMenu}
      />

      <ModalChangeTarget
        isShowModalAlert={isShowModalAlert}
        closeModalAlert7Day={closeModalAlert7Day}
        confirmStepsTarget={confirmStepsTarget}
        formatMessage={formatMessage}
        message={message}
        numberWithCommas={numberWithCommas}
        totalCount={totalCount}
      />

      <ImageBackground
        resizeMode={'stretch'}
        source={require('./images/bg_step_count.png')}
        style={styles.viewCircular}>
        <Text style={styles.txToday}>{formatMessage(message.today)}</Text>
        <View style={styles.viewBorderCircular}>
          <AnimatedCircularProgress
            size={RFValue(170)}
            style={styles.circular}
            width={6}
            duration={3000}
            lineCap="round"
            rotation={0}
            fill={
              ((totalCount -
                (totalCount - countStep > 0 ? totalCount - countStep : 0)) /
                totalCount) *
              100
            }
            tintColor={red_bluezone}
            backgroundColor="#e5e5e5">
            {fill => (
              <View style={styles.viewFill}>
                <Image
                  source={require('./images/ic_run.png')}
                  resizeMode={'contain'}
                  style={{
                    width: RFValue(24, fontSize.STANDARD_SCREEN_HEIGHT),
                    height: RFValue(32, fontSize.STANDARD_SCREEN_HEIGHT),
                  }}
                />
                <Text style={styles.txCountStep}>{numberWithCommas(countStep || 0)}</Text>
                <Text style={styles.txCountTarget}>
                  {formatMessage(message.target)} {numberWithCommas(totalCount || 0)}
                </Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
      </ImageBackground>
      <View style={{ flex: 4 }}>
        <View style={styles.dataHealth}>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_step.png')}
            />
            {locale != 'en' ? <View>
              <Text style={styles.txData}>{`${formatMessage(
                message.stepsToTarget,
              )} ${numberWithCommas((totalCount - countStep) > 0 ? (totalCount - countStep) : 0)}`}</Text>
              <Text style={styles.txUnit}>{`${formatMessage(
                message.stepsNormal,
              )}`}</Text>
            </View> : <View>
              <Text style={styles.txData}>{numberWithCommas((totalCount - countStep) > 0 ? (totalCount - countStep) : 0)} <Text style={[styles.txUnit, { marginTop: 10, fontWeight: '400' }]}>steps</Text> </Text>
              <Text style={styles.txUnit}>to target</Text>
            </View>}


          </View>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_distance.png')}
            />
            <Text style={styles.txData}>{distant.toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.txUnit}>{`km`}</Text>
          </View>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_calories.png')}
            />
            <Text style={styles.txData}>{numberWithCommas(parseInt(countCarlo || 0))}</Text>
            <Text style={styles.txUnit}>{`kcal`}</Text>
          </View>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_time.png')}
            />
            <View style={{ flexDirection: 'row' }}>

              {
                countTimeHour > 0 ? (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.txData, {
                        marginRight: 4,
                        marginTop: 10
                      }]}>{countTimeHour}</Text>
                      <Text style={[styles.txUnit, { marginTop: 10 }]}>{formatMessage(message.hour)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.txData, {
                        marginRight: 5,
                        marginTop: 5
                      }]}>{countTime}</Text>
                      <Text style={[styles.txUnit, { marginTop: 5 }]}>{countTime <= 1 ? formatMessage(message.minute) : formatMessage(message.minutes)}</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.txData}>{countTime}</Text>
                    <Text style={styles.txUnit}>{countTime <= 1 ? formatMessage(message.minute) : formatMessage(message.minutes)}</Text>
                  </View>
                )
              }
            </View>
          </View>
        </View>

        <View style={styles.viewLineChart}>
          {
            renderChart
          }
        </View>

      </View>

      <View style={{ flex: 1 }}>
        <ButtonIconText
          onPress={() =>
            navigation.navigate('stepHistory', {
              dataHealth: { countStep, countRest, countCarlo, distant },
            })
          }
          text={formatMessage(message.viewHistory)}
          styleBtn={[styles.colorButtonConfirm]}
          styleText={{ fontSize: fontSize.normal, fontWeight: 'bold' }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  img: {
    width: RFValue(56, fontSize.STANDARD_SCREEN_HEIGHT),
    height: RFValue(56, fontSize.STANDARD_SCREEN_HEIGHT)
  },
  chart: {
    flex: 1,
  },
  viewLineChart: {
    // marginTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  viewHeight: {
    height: 50,
  },
  viewImgData: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  txData: {
    color: red_bluezone,
    fontSize: RFValue(13, fontSize.STANDARD_SCREEN_HEIGHT),
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'OpenSans-Regular'
  },
  txUnit: {
    fontSize: RFValue(13, fontSize.STANDARD_SCREEN_HEIGHT),
    textAlign: 'center',
    color: red_bluezone,
    marginTop: 5,
    fontFamily: 'OpenSans-Regular'
  },
  dataHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 30,
    marginTop: RFValue(28, fontSize.STANDARD_SCREEN_HEIGHT),
    fontFamily: 'OpenSans-Bold'
  },

  viewCircular: {
    paddingBottom: RFValue(30, fontSize.STANDARD_SCREEN_HEIGHT),
    // marginTop: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    justifyContent: 'center',
    flex: 3,
    height: RFValue(270, fontSize.STANDARD_SCREEN_HEIGHT)
  },
  viewBorderCircular: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 200,
    width: RFValue(192),
    height: RFValue(192),
    justifyContent: 'center',
    alignItems: 'center'
  },
  circular: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewFill: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txCountStep: {
    color: red_bluezone,
    fontSize: RFValue(37, fontSize.STANDARD_SCREEN_HEIGHT),
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'OpenSans-Bold'
  },
  txCountTarget: {
    color: '#949494',
    fontSize: FS(11),
    fontFamily: 'OpenSans-Bold'
  },
  chart: {
    flex: 1,
    height: 300,
  },
  btnHistory: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%',
    height: 41,
    backgroundColor: red_bluezone,
    borderRadius: 20,
    marginBottom: 20,
  },
  txHistory: {
    color: '#fff',
    fontSize: 14,
  },
  txToday: {
    color: '#fff',
    fontSize: RFValue(15, fontSize.STANDARD_SCREEN_HEIGHT),
    marginVertical: RFValue(13, fontSize.STANDARD_SCREEN_HEIGHT),
    textAlign: 'center',
    fontFamily: 'OpenSans-Bold'
  },
  header: {
    backgroundColor: '#ffffff',
    marginTop: isIPhoneX ? 0 : 20,
  },
  colorButtonConfirm: {
    backgroundColor: red_bluezone,
    height: RFValue(46, fontSize.STANDARD_SCREEN_HEIGHT),
    alignSelf: 'center',
    width: RFValue(217, fontSize.STANDARD_SCREEN_HEIGHT),
    borderRadius: 25,
    paddingVertical: 0,
    marginBottom: 10,
    fontFamily: 'OpenSans-Bold'
  }
});

StepCount.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(StepCount);
