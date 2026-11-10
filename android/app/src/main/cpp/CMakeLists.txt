cmake_minimum_required(VERSION 3.22.1)
project("macroengine")

add_library(macroengine SHARED pixel_engine.cpp)
target_link_libraries(macroengine log)
