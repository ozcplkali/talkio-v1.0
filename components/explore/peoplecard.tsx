import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface PeopleCardProps {
    username: string;
    uid: string;
    profilePic: string | null;
    onAddChat?: () => void;
}

export default function Peoplecard({ username, uid, profilePic, onAddChat }: PeopleCardProps) {

    return (
        <View 
            className="flex-row items-center bg-[#334155] p-3 rounded-lg mb-3"
            // onPress={handleProfilePress}
        >
            <View className="w-12 h-12 rounded-full overflow-hidden bg-[#475569] mr-3 items-center justify-center">
                {profilePic ? (
                    <Image
                        source={{ uri: profilePic }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons name="person" size={24} color="#9ca3af" />
                )}
            </View>
            
            <View className="flex-1">
                <Text className="text-white font-semibold">{username}</Text>
            </View>
            
            {onAddChat && (
                <TouchableOpacity 
                    className="bg-[#3b83f648] px-3 py-2 rounded-full mr-2"
                    onPress={onAddChat}
                >
                    <Ionicons name="chatbox-ellipses-outline" size={18} color="white" />
                </TouchableOpacity>
            )}
            
            {/* <Ionicons name="chevron-forward" size={20} color="#9ca3af" /> */}
        </View>
    )
}