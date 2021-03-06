import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  processColor,
} from 'react-native';
import Fitness from '@ovalmoney/react-native-fitness';
// import { BarChart } from 'react-native-charts-wrapper';
import {isIPhoneX} from '../../../core/utils/isIPhoneX';

import {Dimensions} from 'react-native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {ScrollView} from 'react-native-gesture-handler';
// import { LineChart, Grid } from 'react-native-svg-charts'
import moment from 'moment';
import 'moment/locale/vi'; // without this line it didn't work
import Header from '../../../base/components/Header';
import BarChart from './BarChart';
import message from '../../../core/msg/stepCount';
import {injectIntl, intlShape} from 'react-intl';
import * as fontSize from '../../../core/fontSize';
import {useRoute} from '@react-navigation/native';
import dateUtils from 'mainam-react-native-date-utils';
import BartChartHistory from './BarChart/BartChartHistory';

import {objectOf} from 'prop-types';
Date.prototype.getWeek = function(dowOffset) {
  /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

  dowOffset = typeof dowOffset == 'int' ? dowOffset : 0; //default dowOffset to zero
  var newYear = new Date(this.getFullYear(), 0, 1);
  var day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = day >= 0 ? day : day + 7;
  var daynum =
    Math.floor(
      (this.getTime() -
        newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
        86400000,
    ) + 1;
  var weeknum;
  //if the year starts before the middle of a week
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      nYear = new Date(this.getFullYear() + 1, 0, 1);
      nday = nYear.getDay() - dowOffset;
      nday = nday >= 0 ? nday : nday + 7;
      /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
      weeknum = nday < 4 ? 1 : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
};
const screenWidth = Dimensions.get('window').width;
const StepCount = ({props, intl, navigation}) => {
  const route = useRoute();

  const {formatMessage} = intl;

  const [selectDate, setSelectDate] = useState(true);
  const [selectWeek, setSelectWeek] = useState(false);
  const [selectMonth, setSelectMonth] = useState(false);
  const offset = new Date().getTimezoneOffset();
  const [time, setTime] = useState([]);
  const [countStep, setCountStep] = useState(null);
  const [countRest, setCountRest] = useState(0);
  const [countCarlo, setCountCarlo] = useState(0);
  const [distant, setDistant] = useState(0);
  const totalCount = 10000;
  const intervalNow = useRef(null);
  const permissions = [
    {
      kind: Fitness.PermissionKinds.Steps,
      access: Fitness.PermissionAccesses.Read,
    },
    {
      kind: Fitness.PermissionKinds.Calories,
      access: Fitness.PermissionAccesses.Read,
    },
    {
      kind: Fitness.PermissionKinds.Distances,
      access: Fitness.PermissionAccesses.Read,
    },
  ];
  const [dataChart, setDataChart] = useState([]);
  useEffect(() => {
    let end = new Date();
    var start = new Date(1, 1, new Date().getFullYear());
    getDataHealth(start.format('yyyy-MM-dd'), end.format('yyyy-MM-dd'), 'day');
    return () => {
      intervalNow.current && clearInterval(intervalNow.current);
    };
  }, []);

  const onSetSelect = type => () => {
    if (type == 1) {
      let end = new Date();
      let start = new Date(new Date().getFullYear(), 0, 1);
      getDataHealth(
        start.format('yyyy-MM-dd'),
        end.format('yyyy-MM-dd'),
        'day',
      );
      setSelectDate(true);
      setSelectMonth(false);
      setSelectWeek(false);
      return;
    }
    if (type == 2) {
      let end = new Date();
      let start = new Date(new Date().getFullYear(), 0, 1);
      getDataHealth(
        start.format('yyyy-MM-dd'),
        end.format('yyyy-MM-dd'),
        'week',
      );
      setSelectDate(false);
      setSelectMonth(false);
      setSelectWeek(true);
      return;
    }
    if (type == 3) {
      let end = new Date();
      let start = new Date(new Date().getFullYear(), 0, 1);
      getDataHealth(
        start.format('yyyy-MM-dd'),
        end.format('yyyy-MM-dd'),
        'month',
      );
      setSelectDate(false);
      setSelectMonth(true);
      setSelectWeek(false);
      return;
    }
  };
  const getDaysInMonth = (month, year) => {
    var date = new Date(year, month, 1);
    var days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };
  const getDataHealth = (start, end, type) => {
    Fitness.isAuthorized(permissions)
      .then(res => {
        if (res == true) {
          onGetSteps(start, end, type);
          onGetCalories(start, end, type);
          onGetDistances(start, end, type);
        } else {
          Fitness.requestPermissions(permissions)
            .then(res => {})
            .catch(err => {});
        }
      })
      .catch(err => {
        Fitness.requestPermissions(permissions)
          .then(res => {})
          .catch(err => {});
      });
    // Fitness.requestPermissions(permissions).then(res => {
    //     Fitness.getSteps({ startDate: '2020/12/01', endDate: '2020/12/03' }).then(res => {
    //
    //         // setCountStep(res)
    //         alert(JSON.stringify(res))
    //     })
    //

    // }).catch(err => {
    //     alert(JSON.stringify(err))

    //

    // })
  };
  const onRealTime = (start, end, type) => {
    if (intervalNow.current) {
      clearInterval(intervalNow.current);
    }
    intervalNow.current = setInterval(() => {
      //   onGetStepsRealTime(start, end, type);
      // onGetCalories(start,end)
      // onGetDistances(start,end)
    }, 3000);
  };
  const getDataChart = (data, type) => {
    let list = [];
    if (type == 'day') {
      list = data.map(item => ({
        x: new Date(item.endDate).format('dd/MM'),
        y: Number(item.quantity),
      }));
    } else if (type == 'month') {
      list = data
        .map(item => item.startDate)
        .filter((item, i, ar) => ar.indexOf(item) == i)
        .map(obj => {
          let newList = data.filter(item =>
            moment(obj).isBetween(
              moment(item.startDate).startOf('month'),
              moment(item.startDate).endOf('month'),
            ),
          );
          let step = newList.reduce((acc, item) => acc + item.quantity, 0);
          let text = `Tháng ${moment(obj).format('MM')}`;
          return {
            x: text,
            y: step,
          };
        });
    } else if (type == 'week') {
      list = data
        .map(item => item.startDate)
        .filter((item, i, ar) => ar.indexOf(item) == i)
        .map(obj => {
          let newList = data.filter(item =>
            moment(obj).isBetween(
              moment(item.startDate).startOf('isoWeek'),
              moment(item.startDate).endOf('isoWeek'),
            ),
          );

          let step = newList.reduce((acc, item) => acc + item.quantity, 0);

          let start = moment(obj).startOf('isoWeek');
          let end = moment(obj).endOf('isoWeek');
          let isToday = moment(obj).isAfter(moment());
          let text = `${start.format('DD')} - ${
            isToday ? 'nay' : end.format('DD')
          }\nT${start.format('MM')}`;
          return {
            x: text,
            y: step,
          };
        });
    }

    return list;
  };
  const onGetSteps = (start, end, type) => {
    try {
      Fitness.getSteps({startDate: start, endDate: end})
        .then(res => {
          if (res.length) {
            try {
              setDataChart(getDataChart(res, type));
            } catch (e) {}
          }
        })
        .catch(err => {});
    } catch (e) {}
  };
  const onGetDistances = (start, end) => {
    Fitness.getDistances({startDate: start, endDate: end})
      .then(res => {
        //
        var total = res.reduce((acc, obj) => acc + obj.quantity, 0);
        total = total / 1000;
        setDistant(total.toFixed(1));
      })
      .catch(err => {});
  };
  const addDays = (date, days = 1) => {
    var list = [];
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    list.push(result);

    return [...list];
  };

  const getListDate = (startDate, endDate, range = []) => {
    var start = new Date(startDate);
    var end = new Date(endDate);

    if (start > end) {
      return range;
    }
    const next = addDays(start, 1);
    return getListDate(next, end, [...range, start]);
  };
  const numberWithCommas = x => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  const onGetCalories = (start, end) => {
    Fitness.getCalories({startDate: start, endDate: end})
      .then(res => {
        let total = res.reduce((acc, obj) => acc + obj.quantity, 0);
        setCountCarlo(total);
      })
      .catch(err => {});
  };
  const onBack = () => {
    try {
      navigation.pop();
    } catch (e) {}
  };
  const onShowMenu = () => {
    navigation.openDrawer();
  };
  const onGetStepsRealTime = (start, end, type) => {
    try {
      Fitness.getSteps({startDate: start, endDate: end})
        .then(res => {
          if (res.length) {
            setDataChart(getDataChart(res, type));
          }
        })
        .catch(err => {});
    } catch (e) {}
  };
  const onGetDataBySelect = (start, end, maker) => {
    setCountStep(maker);

    // onGetStepsBySelect(start,end)
    onGetCalories(start, end);
    onGetDistances(start, end);
  };
  return (
    <SafeAreaView style={styles.container}>
      <Header
        onBack={onBack}
        colorIcon={'#FE4358'}
        title={formatMessage(message.stepCountHistory)}
        styleHeader={styles.header}
        styleTitle={{
          color: '#000',
          fontSize: fontSize.bigger,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* <View>
                    <Text>Thống kê bước chân</Text>
                </View> */}
        <View style={styles.viewLineChart}>
          {/* {(dataChart.length && (
            <BarChart
              onGetDataBySelect={(start, end, marker) =>
                onGetDataBySelect(start, end, marker)
              }
              data={dataChart}
              time={time}
            />
          )) ||
            null} */}

          {dataChart?.length ? <BartChartHistory data={dataChart} /> : null}
        </View>

        <View style={styles.dataHealth}>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_step.png')}
            />
            <Text style={styles.txData}>{`${countStep || 0}`}</Text>
            <Text style={styles.txUnit}>{`${formatMessage(
              message.stepsNormal,
            )}`}</Text>
          </View>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_distance.png')}
            />
            <Text style={styles.txData}>{distant}</Text>
            <Text style={styles.txUnit}>{`km`}</Text>
          </View>
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_calories.png')}
            />
            <Text style={styles.txData}>{countCarlo}</Text>
            <Text style={styles.txUnit}>{`kcal`}</Text>
          </View>
          {/* <View style={styles.viewImgData}>
                        <Image
                            style={styles.img}
                            source={require('./images/ic_time.png')}
                        />
                        <Text style={styles.txData}>{`50`}</Text>
                        <Text style={styles.txUnit}>{`${formatMessage(
                            message.minute,
                        )}`}</Text>
                    </View> */}
        </View>
      </ScrollView>
      <View style={styles.viewBtn}>
        <TouchableOpacity
          onPress={onSetSelect(1)}
          style={[styles.btnDate, selectDate ? styles.bgRed : {}]}>
          <Text style={[styles.txDate, selectDate ? {} : styles.txGray]}>
            {formatMessage(message.day)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSetSelect(2)}
          style={[styles.btnDate, selectWeek ? styles.bgRed : {}]}>
          <Text style={[styles.txDate, selectWeek ? {} : styles.txGray]}>
            {formatMessage(message.week)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSetSelect(3)}
          style={[styles.btnDate, selectMonth ? styles.bgRed : {}]}>
          <Text style={[styles.txDate, selectMonth ? {} : styles.txGray]}>
            {formatMessage(message.month)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 30,
  },
  bgRed: {
    backgroundColor: '#fe4358',
  },
  header: {
    backgroundColor: '#ffffff',
    marginTop: isIPhoneX ? 0 : 20,
  },
  txGray: {
    color: '#a1a1a1',
  },
  btnDate: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
  },
  img: {},
  chart: {
    flex: 1,
  },
  viewLineChart: {
    marginTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  viewHeight: {
    height: 10,
  },
  viewImgData: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  txData: {
    color: '#fe4358',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  txUnit: {
    fontSize: 14,
    textAlign: 'center',
    color: '#fe4358',
    marginTop: 5,
  },
  dataHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 30,
    marginTop: 20,
    borderTopColor: '#00000010',
    borderBottomColor: '#00000010',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 20,
  },

  viewCircular: {
    paddingVertical: 30,
    marginTop: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    justifyContent: 'center',
  },
  viewBorderCircular: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 200,
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
    color: '#fe4358',
    fontSize: 37,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  txCountTarget: {
    color: '#949494',
    fontSize: 14,
  },
  chart: {
    flex: 1,
    height: 300,
  },
  txDate: {
    color: '#fff',
    fontSize: 14,
  },
  txtYear: {
    fontSize: fontSize.normal,
    fontWeight: 'bold',
    paddingBottom: 5,
    alignSelf: 'center',
  },
});
StepCount.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(StepCount);
