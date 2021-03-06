import React, {useState, useEffect} from 'react';
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
import {getProfile, getStepChange} from '../../../core/storage';
import {getAbsoluteMonths, getAllDistance, gender} from '../../../core/steps';
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
  const [time, setTime] = useState(0);
  const [countStep, setCountStep] = useState(null);
  const [countRest, setCountRest] = useState(0);
  const [countCarlo, setCountCarlo] = useState(0);
  const [distant, setDistant] = useState(0);
  const [dataChart, setDataChart] = useState([]);

  useEffect(() => {
    let end = new Date();
    var start = new Date(new Date().getFullYear(), 0, 1);
    getDataHealth(start.format('yyyy-MM-dd'), end.format('yyyy-MM-dd'), 'day');
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
  const getDataHealth = async (start, end, type) => {
    try {
      let step = (await getStepChange()) || [];
      let profiles = (await getProfile()) || [];
      let profile = profiles.find(
        item =>
          getAbsoluteMonths(moment(item.date)) - getAbsoluteMonths(moment()) ==
          0,
      );
      let sex = gender[profile?.gender || 0];
      let height = profile?.height?.substring(0, profile?.height?.length - 3);
      let weight = Number(
        profile?.weight
          ?.substring(0, profile?.weight?.length - 3)
          .replace(', ', '.'),
      );

      let result = getAllDistance(step, sex, height, weight);

      setDistant(result?.distance);
      setCountCarlo(result?.calories);
      setTime(moment(result?.time).format('mm:ss'));
      let data = step
        .map(item => new Date(item.time).format('dd/MM/yyyy'))
        .filter((item, i, arr) => arr.indexOf(item) == i)
        .map(obj => {
          let newList = step.filter(
            item => new Date(item.time).format('dd/MM/yyyy') == obj,
          );
          let step2 = Math.max.apply(Math, newList.map(item => item.step));
          return {
            time: obj,
            step: step2,
          };
        }, []);
      let totalStep = data.reduce((acc, item) => acc + item.step, 0);

      setCountStep(totalStep);

      let list = [];
      if (type == 'day') {
        list = data.map(item => ({
          x: moment(item.time, 'DD/MM/YYYY').format('DD/MM'),
          y: item.step,
        }));
      } else if (type == 'month') {
        list = data
          .map(item => item.time)
          .filter((item, i, ar) => ar.indexOf(item) == i)
          .map(obj => {
            let newList = data.filter(item =>
              moment(obj, 'DD/MM/YYYY').isBetween(
                moment(item.time, 'DD/MM/YYYY').startOf('month'),
                moment(item.time, 'DD/MM/YYYY').endOf('month'),
              ),
            );
            let step = newList.reduce((acc, item) => acc + item.step, 0);
            let isToday = moment(obj, 'DD/MM/YYYY').isBetween(
              moment().startOf('month'),
              moment().endOf('month'),
              'month',
              '[]',
            );
            let text = `Tháng \n${
              isToday ? 'này' : moment(obj, 'DD/MM/YYYY').format('MM')
            }`;
            return {
              x: text,
              y: step,
            };
          });
      } else if (type == 'week') {
        list = data
          .map(item => item.time)
          .filter((item, i, ar) => ar.indexOf(item) == i)
          .map(obj => {
            let newList = data.filter(item =>
              moment(obj, 'DD/MM/YYYY').isBetween(
                moment(item.time, 'DD/MM/YYYY').startOf('isoWeek'),
                moment(item.time, 'DD/MM/YYYY').endOf('isoWeek'),
                'isoWeek',
                '[]',
              ),
            );

            let step = newList.reduce((acc, item) => acc + item.step, 0);

            let start = moment(obj, 'DD/MM/YYYY').startOf('isoWeek');
            let end = moment(obj, 'DD/MM/YYYY').endOf('isoWeek');
            let isToday = moment(obj, 'DD/MM/YYYY').isBetween(
              moment().startOf('isoWeek'),
              moment().endOf('isoWeek'),
              'isoWeek',
              '[]',
            );

            let text = `${start.format('DD')} - ${
              isToday ? 'nay' : end.format('DD')
            }\nT${start.format('MM')}`;
            return {
              x: text,
              y: step,
            };
          });
      }
      setDataChart(list);
    } catch (error) {}
  };
  const onBack = () => {
    try {
      navigation.pop();
    } catch (e) {}
  };
  const onShowMenu = () => {
    navigation.openDrawer();
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
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
        <View style={styles.viewLineChart}>
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
          <View style={styles.viewImgData}>
            <Image
              style={styles.img}
              source={require('./images/ic_time.png')}
            />
            <Text style={styles.txData}>{time}</Text>
            <Text style={styles.txUnit}>{`${formatMessage(
              message.minute,
            )}`}</Text>
          </View>
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
