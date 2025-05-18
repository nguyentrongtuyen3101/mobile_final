import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
    setIsFirstLaunch: (value: boolean) => void;
}

export default function CheckFirstLaunch({ setIsFirstLaunch }: Props) {
    useEffect(() => {
        const checkLaunch = async () => {
            const value = await AsyncStorage.getItem('alreadyLaunched');
            if (value === null) {
                await AsyncStorage.setItem('alreadyLaunched', 'true');
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }
        };

        checkLaunch();
    }, []);

    return null;
}
