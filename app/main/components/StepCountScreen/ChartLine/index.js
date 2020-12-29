import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  Button,
  View,
  processColor,
  ScrollView,
} from 'react-native';
import update from 'immutability-helper';
import styles from './styles/index.css';
import { LineChart } from 'react-native-charts-wrapper';
import { red_bluezone ,blue_bluezone} from '../../../../core/color';
import { VictoryChart,VictoryLine,VictoryTheme,VictoryGroup,VictoryScatter  } from 'victory-native';
const distanceToLoadMore = 10;
const pageSize = 10;
class ChartLine extends React.Component {
  constructor(props) {
    super(props);
    this.xMin = 6;
    this.xMax = 7;
    this.state = {
      data: {},
      year: null,
      xAxis: {
        granularityEnabled: true,
        granularity: 1,
        axisLineWidth: 0,
        position: 'TOP',
        labelCount: 6,
        // drawAxisLines: true,
        avoidFirstLastClipping: true,
      },
    };
  }
  componentDidMount() {
    console.log('this.props.data: ', this.props.data);
    let newState = update(this.state, {
      data: {
        $set: {
          dataSets: this.getDataChart(this.props.data),
        },
      },
    });
    console.log('newState: ', newState);
    this.setState(newState);
    

    this.setState({
      xAxis: { ...this.state.xAxis, valueFormatter: this.props.time },
    });
  }

  getDataChart = (dataCharts = []) => {
    console.log('dataChartsdataChartsdataChartsdataCharts',dataCharts)
    let data = dataCharts.map((e, i) => {
      return {
        values: e.values,
        label: e.label || '',
        config: {
          color: processColor(red_bluezone),
          drawCircles: true,
          lineWidth: 2,
          drawValues: false,
          // axisDependency: 'LEFT',
          circleColor: processColor(red_bluezone),
          circleRadius: e.values.filter((item ,index) => index == this.state?.selectedX?.x ? 2 : 4 ) ,
          drawCircleHole: true,
          mode: 'HORIZONTAL_BEZIER',
          fillColor: processColor(red_bluezone),
          // highlightColor:processColor('#FFF'),
          fillAlpha: 15,
          drawFilled: true,
        },
      };
    });

    return data;
  };
  componentWillReceiveProps = preProps => {
    console.log('prePropsprePropspreProps',preProps)
    if (this.props.data != preProps.data) {
      let newState = update(this.state, {
        data: {
          $set: {
            dataSets: this.getDataChart(preProps.data),
          },
        },
      });

      this.setState(newState);
    }
    if (this.props.time != preProps.time) {
      this.setState(pre => ({
        xAxis: {
          ...pre.xAxis,
          valueFormatter: preProps.time,
        },
      }));
    }
  };

  handleChange = event => {
    // let nativeEvent = event.nativeEvent;
    // if (nativeEvent.action == 'chartTranslated') {
    //   let {left, right, centerX} = nativeEvent;
    //   console.log(
    //     'data is from ' +
    //       this.xMin +
    //       ' to ' +
    //       this.xMax +
    //       ' left ' +
    //       left +
    //       ' right ' +
    //       right +
    //       ' isLoading ' +
    //       this.isLoading,
    //   );
    //   if (!this.isLoading) {
    //     if (left < 2) {
    //       this.isLoading = true;
    //       if (this.timeout) clearTimeout(this.timeout);
    //       this.timeout = setTimeout(() => {
    //         this.props.loadMore && this.props.loadMore();
    //         this.isLoading = false;
    //       }, 500);
    //       // Because of the implementation of MpAndroidChart, if the action of setDataAndLockIndex is triggered by user dragging,
    //       // then the size of new data should be equal to original data, otherwise the calculation of position transition won't be accurate,
    //       // use may find the chart suddenly blink to another position.
    //       // This restriction only exists in android, in iOS, we have no such problem.
    //       // this.mockLoadDataFromServer(
    //       //   centerX - pageSize,
    //       //   centerX + pageSize,
    //       // ).then(data => {
    //       //   this.refs.chart.setDataAndLockIndex(data);
    //       //   this.isLoading = false;
    //       // });
    //     }
    //   }
    // }
  };
  handleSelect = event => {
    let entry = event.nativeEvent;
    console.log('entry: ', entry);

    if (entry == null) {
      this.setState({
        ...this.state,
        selectedEntry: null,
      });
    } else {
      this.setState({
        ...this.state,
        selectedX:entry,
        selectedEntry: JSON.stringify(entry),
        year: entry?.data?.year,
      },() => this.getDataChart(this.props.data));
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.txtYear}>{this.state.year}</Text>
        <VictoryChart
        animate={{
          duration: 1000,
          onLoad: { duration: 1000 }
        }}
          theme={VictoryTheme.material}
        >
          <VictoryGroup  data={[
              { x: 1, y: 2 },
              { x: 2, y: 3 },
              { x: 3, y: 5 },
              { x: 4, y: 4 },
              { x: 5, y: 7 }
            ]}>
          <VictoryLine
          interpolation="natural"
            style={{
              data: { stroke: "#c43a31" },
              parent: { border: "1px solid #ccc"}
            }}
           
          />
    <VictoryScatter 
     style={{
      data: { stroke: "#c43a31" },
      parent: { border: "1px solid #ccc"}
    }}
    />
          </VictoryGroup>
         
          
        </VictoryChart>
      </View>
    );
  }
}

export default ChartLine;
