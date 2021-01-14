import React, { useState, useEffect } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  Button,
  View,
  processColor, Image,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import update from 'immutability-helper';
import styles from './styles/index.css';
import { LineChart } from 'react-native-charts-wrapper';
import { red_bluezone, blue_bluezone } from '../../../../core/color';
import { RFValue } from '../../../../const/multiscreen';

import {
  VictoryChart, VictoryLine, VictoryTheme, VictoryGroup,
  VictoryTooltip, VictoryLabel,
  VictoryScatter, VictoryAxis, VictoryArea
} from 'victory-native';
import { Svg, Circle, Defs, Rect, G, Use, LinearGradient, Stop } from 'react-native-svg';
const distanceToLoadMore = 10;
const pageSize = 10;
const { width, height } = Dimensions.get('window')

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
      topLabel: null,
      maxCounter: 0,
      leftLabel: null,
      dataConvert: []
    };
  }
  componentDidMount() {
    console.log('propsopropsopropsorps', this.props)
    const datanew = this.props.data.map((it, index) => {
      return {
        ...it,
        x: index + 1
      }
    })
    console.log('datanewdatanewdatanewdatanew', datanew)
    const max = Math.max.apply(Math, datanew.map(i => i.y));
    this.setState({ dataConvert: datanew, maxCounter: max })
  }

  getLeftLabel = () => {
    const value = this.state?.value?.length
    if (value == 1) {
      return this.state.leftLabel - width * 0.04
    }
    if (value == 2) {
      return this.state.leftLabel - width * 0.05
    }
    if (value == 3) {
      return this.state.leftLabel - width * 0.055
    }
    if (value == 4) {
      return this.state.leftLabel - width * 0.07
    }
    if (value == 5) {
      return this.state.leftLabel - width * 0.08
    }
  }

  renderCharMain = () => {
    return (
      <VictoryChart
        // padding=""
        height={RFValue(200)}
        minDomain={{ y: 0 }}
        maxDomain={{ y: this.state.maxCounter <= 10000 ? RFValue(12000) : this.state.maxCounter }}
      // theme={VictoryTheme.material}
      >
        <Defs>
          <LinearGradient id="gradientStroke"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#FE4358" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#FE4358" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>



        <VictoryAxis
          tickValues={this.props.time}
          // tickValues={['10/11', '11/11', '12/11', '13/11', '14/11', '15/11', '16/11']}

          style={{
            grid: { stroke: ({ tick, index }) => this.state.valueX == index + 1 ? '#FE4358' : 'gray', strokeWidth: 0.5 },
            axis: { stroke: 'none' },
            tickLabels: { fill: ({ tick, index }) => this.state.valueX == index + 1 ? '#FE4358' : '#3F3F3F',fontSize:14,fontWeight:'350', }
          }}
          orientation="top"
        />


        <VictoryAxis
          theme={VictoryTheme.material}
          standalone
          padding={{top:30}}
          key='axis-target'
          dependentAxis
          tickFormat={() => ''}
          tickValues={[100000]}
          style={{
            axis: { stroke: "none" },
            grid: { stroke: ({ tick }) => 'blue' },
          }}
        />


        <VictoryGroup
        
          style={{ labels: { fill: 'none' } }}
          data={this.state.dataConvert}
          // data={[
          //   { x: 1, y: 3000 },
          //   { x: 2, y: 4000 },
          //   { x: 3, y: 5000 },
          //   { x: 4, y: 3000 },
          //   { x: 5, y: 6000 },
          //   { x: 6, y: 10000 },
          //   { x: 7, y: 3000 },
          // ]}
        >
          <VictoryArea
            interpolation="natural"
            style={{ data: { fill: 'url(#gradientStroke)', opacity: 0.5 } }}
          // data={sampleData}
          />

          <VictoryLine
            animate={{
              duration: 200,
              onLoad: { duration: 200 }
            }}
            interpolation="natural"
            style={{
              data: { stroke: "#FE4358" },
              
              parent: { border: "1px solid #ccc" ,paddingBottom:300}
            }}

          />

          <VictoryScatter
            style={{
              data: {
                fill: ({ datum }) => datum.x === this.state?.valueX ? "white" : "#FE4358",
                stroke: ({ datum }) => datum.x === this.state?.valueX ? "red" : "#FE4358",
                strokeWidth: ({ datum }) => datum.x === this.state?.valueX ? 1 : 0,
              },
              labels: {
                fontSize: 15,
                fill: ({ datum }) => datum.x === this.state?.valueX ? "white" : "#FE4358"
              }
            }}
            size={({ datum }) => datum.x === this.state?.valueX ? RFValue(9) : RFValue(6)}
            labels={() => null}
          />
          <VictoryScatter
            style={{
              data: {
                fill: ({ datum }) => "#FE4358",
                stroke: ({ datum }) => "#FE4358",
                strokeWidth: ({ datum }) => 0,
              },
              labels: {
                fontSize: 15,
                fill: "#FE4358"
              }
            }}
            size={RFValue(6)}
            labels={() => null}

            events={[{
              target: "data",
              eventHandlers: {
                onPressIn: () => {
                  return [
                    {
                      target: "data",
                      mutation: (props) => {
                        this.setState({
                          topLabel: props.y,
                          leftLabel: props.x,
                          value: JSON.stringify(props.datum.y),
                          valueX: props?.datum?.x,
                          // year: props?.datum?.year
                        })
                      }
                    }
                  ];
                }
              }
            }]}

          />


        </VictoryGroup>


      </VictoryChart>

    )
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.txtYear}>{this.state.year}</Text>
        {this.state.topLabel && this.state.leftLabel &&
          <View style={{
            position: 'absolute',
            backgroundColor: '#FE4358',
            zIndex: 1,
            top: this.state.topLabel - height * 0.045,
            left: this.getLeftLabel(),
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderRadius: 15, borderColor: 'red'
          }}>
            <Text style={{
              color: 'white'
            }}>{this.state.value}</Text>
            <Image
              style={{
                zIndex: -1,
                width: 30, height: 30,
                position: 'absolute', bottom: -10, alignSelf: 'center'
              }}
              source={require('../images/down-arrow.png')} />
          </View>
        }
        <View style={{
          position: 'absolute',
          backgroundColor: '#FE4358',
          zIndex: 1,
          top: height * 0.08,
          // left: ,
          alignSelf: 'center',
          paddingHorizontal: RFValue(10),
          paddingVertical: RFValue(3),
          borderWidth: 1,
          borderRadius: 15, borderColor: 'red'
        }}>
          <Text style={{
            color: 'white'
          }}>{this.props.totalCount}</Text>
          <Image
            style={{
              zIndex: -1,
              width: RFValue(20), height: RFValue(20),
              position: 'absolute', bottom: RFValue(-8), alignSelf: 'center'
            }}
            source={require('../images/down-arrow.png')} />
        </View>
        <View style={{
          height: 1, width: width * 0.76,
          alignSelf: 'center',
          backgroundColor: 'white',
          position: 'absolute',
          top: height * 0.12,
          borderColor: '#FE4358',
          borderWidth: 1, borderStyle: 'dashed',
          borderRadius: 1
        }} />
        {
          Platform.OS == 'android' ? (
            <Svg>
              {
                this.renderCharMain()
              }
            </Svg>
          ) : this.renderCharMain()
        }
        {/* <Svg> */}
        {/* </Svg> */}

      </View>
    );
  }
}

export default ChartLine;
