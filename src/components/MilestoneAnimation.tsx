import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ThemeType, calculateProgressStage } from '../types/Theme';

interface Props {
  progress: number;
  theme?: ThemeType;
  showLabel?: boolean;
}

type BuildStep = {
  label: string;
  from: number;
  to: number;
};

function getBuildSteps(theme: ThemeType): BuildStep[] {
  if (theme === 'house') {
    return [
      { label: 'Land', from: 0, to: 0.2 },
      { label: 'Foundation', from: 0.2, to: 0.4 },
      { label: 'Walls', from: 0.4, to: 0.6 },
      { label: 'Roof', from: 0.6, to: 0.8 },
      { label: 'Landscaping', from: 0.8, to: 1 },
    ];
  }

  if (theme === 'car') {
    return [
      { label: 'Frame', from: 0, to: 0.2 },
      { label: 'Wheels', from: 0.2, to: 0.4 },
      { label: 'Body', from: 0.4, to: 0.65 },
      { label: 'Interior', from: 0.65, to: 0.85 },
      { label: 'Detailing', from: 0.85, to: 1 },
    ];
  }

  if (theme === 'island') {
    return [
      { label: 'Shore', from: 0, to: 0.2 },
      { label: 'Palms', from: 0.2, to: 0.45 },
      { label: 'Lagoon', from: 0.45, to: 0.7 },
      { label: 'Cabana', from: 0.7, to: 0.9 },
      { label: 'Sunset', from: 0.9, to: 1 },
    ];
  }

  if (theme === 'rocket') {
    return [
      { label: 'Launch Pad', from: 0, to: 0.2 },
      { label: 'Core Body', from: 0.2, to: 0.45 },
      { label: 'Fuel + Fins', from: 0.45, to: 0.7 },
      { label: 'Ignition', from: 0.7, to: 0.9 },
      { label: 'Lift-off', from: 0.9, to: 1 },
    ];
  }

  return [
    { label: 'Seed', from: 0, to: 0.2 },
    { label: 'Roots', from: 0.2, to: 0.4 },
    { label: 'Trunk', from: 0.4, to: 0.65 },
    { label: 'Branches', from: 0.65, to: 0.85 },
    { label: 'Canopy', from: 0.85, to: 1 },
  ];
}

function getStageLabel(progress: number, steps: BuildStep[]): string {
  if (progress >= 1) return 'Goal complete';
  const current = steps.find((step) => progress >= step.from && progress < step.to);
  return current ? `Building: ${current.label}` : 'Building';
}

function rangeOpacity(progress: number, from: number, to: number): number {
  if (progress <= from) return 0;
  if (progress >= to) return 1;
  return (progress - from) / Math.max(to - from, 0.0001);
}

function HouseScene({ progress }: { progress: number }) {
  const foundationOpacity = rangeOpacity(progress, 0.18, 0.38);
  const wallsOpacity = rangeOpacity(progress, 0.36, 0.6);
  const roofOpacity = rangeOpacity(progress, 0.58, 0.82);
  const landscapingOpacity = rangeOpacity(progress, 0.8, 1);

  return (
    <View style={styles.sceneInner}>
      <View style={styles.houseSky} />
      <View style={[styles.houseGround, { opacity: rangeOpacity(progress, 0, 0.22) }]} />
      <View style={[styles.houseFoundation, { opacity: foundationOpacity }]} />
      <View style={[styles.houseWalls, { opacity: wallsOpacity }]} />
      <View style={[styles.houseDoor, { opacity: wallsOpacity }]} />
      <View style={[styles.houseRoof, { opacity: roofOpacity }]} />
      <View style={[styles.treeLeft, { opacity: landscapingOpacity }]} />
      <View style={[styles.treeRight, { opacity: landscapingOpacity }]} />
    </View>
  );
}

function TreeScene({ progress }: { progress: number }) {
  return (
    <View style={styles.sceneInner}>
      <View style={styles.treeSky} />
      <View style={[styles.treeGround, { opacity: rangeOpacity(progress, 0, 0.25) }]} />
      <View style={[styles.treeTrunk, { opacity: rangeOpacity(progress, 0.2, 0.5) }]} />
      <View style={[styles.treeCanopy, { opacity: rangeOpacity(progress, 0.45, 0.8) }]} />
      <View style={[styles.treeCanopySmall, { opacity: rangeOpacity(progress, 0.75, 1) }]} />
    </View>
  );
}

function RocketScene({ progress }: { progress: number }) {
  return (
    <View style={styles.sceneInner}>
      <View style={styles.rocketSky} />
      <View style={[styles.rocketGround, { opacity: rangeOpacity(progress, 0, 0.22) }]} />
      <View style={[styles.launchPad, { opacity: rangeOpacity(progress, 0.08, 0.26) }]} />
      <View style={[styles.rocketBody, { opacity: rangeOpacity(progress, 0.2, 0.52) }]} />
      <View style={[styles.rocketNose, { opacity: rangeOpacity(progress, 0.42, 0.68) }]} />
      <View style={[styles.rocketFinLeft, { opacity: rangeOpacity(progress, 0.42, 0.72) }]} />
      <View style={[styles.rocketFinRight, { opacity: rangeOpacity(progress, 0.42, 0.72) }]} />
      <View style={[styles.rocketFlame, { opacity: rangeOpacity(progress, 0.78, 1) }]} />
    </View>
  );
}

function IslandScene({ progress }: { progress: number }) {
  return (
    <View style={styles.sceneInner}>
      <View style={styles.islandSky} />
      <View style={[styles.islandWater, { opacity: rangeOpacity(progress, 0, 0.22) }]} />
      <View style={[styles.islandSand, { opacity: rangeOpacity(progress, 0.18, 0.42) }]} />
      <View style={[styles.palmTrunk, { opacity: rangeOpacity(progress, 0.38, 0.7) }]} />
      <View style={[styles.palmLeaves, { opacity: rangeOpacity(progress, 0.55, 0.85) }]} />
      <View style={[styles.cabana, { opacity: rangeOpacity(progress, 0.78, 1) }]} />
    </View>
  );
}

function CarScene({ progress }: { progress: number }) {
  return (
    <View style={styles.sceneInner}>
      <View style={styles.carSky} />
      <View style={[styles.carRoad, { opacity: rangeOpacity(progress, 0, 0.2) }]} />
      <View style={[styles.carBody, { opacity: rangeOpacity(progress, 0.2, 0.5) }]} />
      <View style={[styles.carWheelLeft, { opacity: rangeOpacity(progress, 0.35, 0.65) }]} />
      <View style={[styles.carWheelRight, { opacity: rangeOpacity(progress, 0.35, 0.65) }]} />
      <View style={[styles.carRoof, { opacity: rangeOpacity(progress, 0.5, 0.82) }]} />
      <View style={[styles.carWindow, { opacity: rangeOpacity(progress, 0.72, 1) }]} />
    </View>
  );
}

function ThemeScene({ theme, progress }: { theme: ThemeType; progress: number }) {
  if (theme === 'house') return <HouseScene progress={progress} />;
  if (theme === 'rocket') return <RocketScene progress={progress} />;
  if (theme === 'island') return <IslandScene progress={progress} />;
  if (theme === 'car') return <CarScene progress={progress} />;
  return <TreeScene progress={progress} />;
}

export default function MilestoneAnimation({ 
  progress, 
  theme = 'tree',
  showLabel = true,
}: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const safeProgress = Math.max(0, Math.min(1, progress));
  const sceneHeight = showLabel ? 150 : 96;

  const progressPercent = safeProgress * 100;
  const progressStage = calculateProgressStage(progressPercent);
  const steps = useMemo(() => getBuildSteps(theme), [theme]);
  const stageLabel = getStageLabel(safeProgress, steps);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.sceneFrame,
          { height: sceneHeight, transform: [{ scale: pulse }] },
        ]}
      >
        <View style={styles.fadedScene}>
          <ThemeScene theme={theme} progress={1} />
        </View>

        <View style={styles.revealContainer}>
          <ThemeScene theme={theme} progress={safeProgress} />
        </View>
      </Animated.View>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{stageLabel}</Text>
          <Text style={styles.progressText}>{Math.round(safeProgress * 100)}% visible</Text>
          <Text style={styles.stageText}>Stage {progressStage + 1} of 11</Text>
          {theme === 'house' && (
            <Text style={styles.houseStepText}>{'Land -> Foundation -> Walls -> Roof -> Landscaping'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center', 
    paddingVertical: 10,
    minHeight: 108,
    justifyContent: 'center',
  },
  sceneFrame: {
    width: 210,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E7D8',
    backgroundColor: '#F6FBF4',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fadedScene: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  revealContainer: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sceneInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  houseSky: { position: 'absolute', top: 0, left: 0, right: 0, height: 82, backgroundColor: '#DCEEFF' },
  houseGround: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, backgroundColor: '#7CB66D' },
  houseFoundation: { position: 'absolute', bottom: 44, left: 64, width: 82, height: 12, backgroundColor: '#969696' },
  houseWalls: { position: 'absolute', bottom: 56, left: 68, width: 74, height: 44, backgroundColor: '#F3E2C0' },
  houseDoor: { position: 'absolute', bottom: 56, left: 95, width: 16, height: 24, backgroundColor: '#8C5C36' },
  houseRoof: {
    position: 'absolute',
    bottom: 100,
    left: 62,
    width: 0,
    height: 0,
    borderLeftWidth: 44,
    borderRightWidth: 44,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#C54A3A',
  },
  treeLeft: { position: 'absolute', bottom: 44, left: 26, width: 26, height: 34, borderRadius: 15, backgroundColor: '#4E9A51' },
  treeRight: { position: 'absolute', bottom: 42, right: 24, width: 30, height: 40, borderRadius: 18, backgroundColor: '#4E9A51' },

  treeSky: { position: 'absolute', top: 0, left: 0, right: 0, height: 90, backgroundColor: '#DCEEFF' },
  treeGround: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#82BC6F' },
  treeTrunk: { position: 'absolute', bottom: 40, left: 96, width: 16, height: 44, backgroundColor: '#8D5B37' },
  treeCanopy: { position: 'absolute', bottom: 72, left: 72, width: 64, height: 52, borderRadius: 28, backgroundColor: '#4EAE56' },
  treeCanopySmall: { position: 'absolute', bottom: 98, left: 88, width: 34, height: 30, borderRadius: 16, backgroundColor: '#5BC864' },

  rocketSky: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0F213A' },
  rocketGround: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, backgroundColor: '#3E5872' },
  launchPad: { position: 'absolute', bottom: 28, left: 72, width: 66, height: 8, backgroundColor: '#A7B5C4' },
  rocketBody: { position: 'absolute', bottom: 36, left: 92, width: 26, height: 70, borderRadius: 12, backgroundColor: '#E9EEF4' },
  rocketNose: {
    position: 'absolute',
    bottom: 106,
    left: 92,
    width: 0,
    height: 0,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D03F3F',
  },
  rocketFinLeft: { position: 'absolute', bottom: 40, left: 82, width: 10, height: 20, backgroundColor: '#D03F3F' },
  rocketFinRight: { position: 'absolute', bottom: 40, left: 118, width: 10, height: 20, backgroundColor: '#D03F3F' },
  rocketFlame: { position: 'absolute', bottom: 20, left: 97, width: 16, height: 16, borderRadius: 9, backgroundColor: '#F9B233' },

  islandSky: { position: 'absolute', top: 0, left: 0, right: 0, height: 68, backgroundColor: '#CBEAFF' },
  islandWater: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 58, backgroundColor: '#56BFE6' },
  islandSand: {
    position: 'absolute',
    bottom: 38,
    left: 54,
    width: 102,
    height: 30,
    borderRadius: 22,
    backgroundColor: '#F4D28A',
  },
  palmTrunk: { position: 'absolute', bottom: 62, left: 102, width: 8, height: 38, backgroundColor: '#8C5C36', transform: [{ rotate: '-12deg' }] },
  palmLeaves: { position: 'absolute', bottom: 92, left: 86, width: 40, height: 24, borderRadius: 16, backgroundColor: '#4A9C50' },
  cabana: { position: 'absolute', bottom: 64, right: 64, width: 34, height: 24, backgroundColor: '#E2B970' },

  carSky: { position: 'absolute', top: 0, left: 0, right: 0, height: 76, backgroundColor: '#DBEDFF' },
  carRoad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 34, backgroundColor: '#5A6272' },
  carBody: { position: 'absolute', bottom: 34, left: 52, width: 106, height: 32, borderRadius: 12, backgroundColor: '#E24E4E' },
  carRoof: { position: 'absolute', bottom: 56, left: 80, width: 50, height: 20, borderRadius: 10, backgroundColor: '#F26A6A' },
  carWindow: { position: 'absolute', bottom: 60, left: 90, width: 30, height: 12, borderRadius: 6, backgroundColor: '#D2EEFF' },
  carWheelLeft: { position: 'absolute', bottom: 20, left: 66, width: 24, height: 24, borderRadius: 12, backgroundColor: '#1F2430' },
  carWheelRight: { position: 'absolute', bottom: 20, left: 122, width: 24, height: 24, borderRadius: 12, backgroundColor: '#1F2430' },

  labelContainer: { 
    marginTop: 8,
    alignItems: 'center',
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#52705A',
    marginBottom: 2,
  },
  stageText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  houseStepText: {
    fontSize: 11,
    color: '#6C7A72',
    marginTop: 3,
  },
});
